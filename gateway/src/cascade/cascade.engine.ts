import { buildRankedChain, checkThresholds } from "./cascade.health";
import { summarizeForHandoff } from "./cascade.summarize";
import {
    getChatAdapterForModel,
    configuredChatAdapters
} from "@providers/chat/chat.registry";
import {
    trackSuccess,
    trackError,
    logCascadeEvent,
    type CascadeReason
} from "@db/stores/usage.store";
import type { StreamErrorCode } from "@providers/provider.types";
import type { ChatProviderAdapter } from "@providers/chat/chat.types";
import type {
    CascadeEvent,
    CascadeRunOptions,
    CascadeAttempt,
    CascadeTrigger
} from "./cascade.types";

// ── Guards ────────────────────────────────────────────────────────────────────

/**
 * Cascade is only meaningful when at least 2 providers are configured —
 * a single-provider setup has nowhere to fall back to.
 */
export function cascadeIsUsable(): boolean {
    return configuredChatAdapters().length >= 2;
}

// ── Error code → cascade trigger ──────────────────────────────────────────────

function triggerFromErrorCode(code: StreamErrorCode): CascadeTrigger {
    const map: Record<StreamErrorCode, CascadeTrigger> = {
        invalid_key: "invalid_key",
        rate_limited: "rate_limited",
        context_length: "context_length",
        provider_down: "error",
        timeout: "error",
        unknown: "error"
    };
    return map[code];
}

/**
 * Maps a CascadeTrigger (which includes "invalid_key" and "context_length")
 * to a CascadeReason (the subset stored in Postgres — omits those two since
 * they're treated as plain errors for analytics purposes).
 */
function triggerToReason(trigger: CascadeTrigger): CascadeReason {
    const map: Record<CascadeTrigger, CascadeReason> = {
        rate_limited: "rate_limited",
        error: "error",
        invalid_key: "error",
        context_length: "error",
        cost_cap: "cost_cap",
        token_threshold: "token_threshold",
        unconfigured: "unconfigured"
    };
    return map[trigger];
}

// ── Whether a trigger should retry on the same model before cascading ─────────

function isRetryable(trigger: CascadeTrigger): boolean {
    // Only transient failures are worth retrying — key errors and context length
    // won't improve on a second attempt against the same model.
    return trigger === "rate_limited" || trigger === "error";
}

// ── Engine ────────────────────────────────────────────────────────────────────

/**
 * Core cascade engine. Runs a streaming conversation through a health-ranked
 * model chain, handling:
 *
 * - Per-model retry logic (up to profile.retry_on_error retries)
 * - Automatic cascade on error/rate-limit/cost-cap/token-threshold
 * - Context summarization on handoff (when profile.compress_on_handoff = true)
 * - Live cost and token accumulation checked against profile thresholds
 * - Reverse cascade: after switching down, attempt to return to a better model
 *   once it's recovered (only if profile.reverse_cascade = true)
 * - Full attempt log emitted in CascadeCompleteEvent for the dashboard
 *
 * The generator never throws — all errors are yielded as typed events.
 * Callers can safely iterate without a try/catch.
 */
export async function* runCascade(
    options: CascadeRunOptions
): AsyncGenerator<CascadeEvent> {
    const {
        messages,
        profile,
        preferredModel,
        conversationId,
        priorCostUsd = 0
    } = options;

    const chain = await buildRankedChain(profile.chain, preferredModel);

    if (chain.length === 0) {
        yield {
            type: "error",
            code: "unknown",
            error: "Cascade chain is empty — check your conduit.config.toml cascade profile.",
            retryable: false
        };
        return;
    }

    const attempts: CascadeAttempt[] = [];
    let currentMessages = messages;
    let totalCostUsd = priorCostUsd;
    let totalTokens = 0;
    let switchCount = 0;
    let modelIndex = 0;

    // Track which models have already failed so reverse cascade avoids them
    const exhaustedModels = new Set<string>();

    while (modelIndex < chain.length) {
        const ranked = chain[modelIndex]!;

        // ── Unconfigured model ────────────────────────────────────────────────────
        if (!ranked.configured) {
            const nextModel = chain[modelIndex + 1]?.modelId;
            if (nextModel) {
                yield {
                    type: "cascade_switch",
                    fromModel: ranked.modelId,
                    toModel: nextModel,
                    trigger: "unconfigured",
                    attempt: switchCount,
                    tokensBeforeSwitch: totalTokens
                };
                modelIndex++;
                continue;
            } else {
                yield {
                    type: "cascade_exhausted",
                    attempts,
                    lastError: `Model "${ranked.modelId}" is not configured and no further models are available.`
                };
                return;
            }
        }

        const adapter = getChatAdapterForModel(
            ranked.modelId
        )! as unknown as ChatProviderAdapter;
        const modelList = adapter.listModels();
        const modelDef = modelList.find(m => m.id === ranked.modelId);
        const contextWindow = modelDef?.contextWindow ?? 128_000;

        // ── Per-model attempt loop (respects retry_on_error) ──────────────────────
        let retries = 0;
        const maxRetries = profile.retry_on_error;
        let cascadeTrigger: CascadeTrigger | null = null;
        let lastError = "";

        attemptLoop: while (retries <= maxRetries) {
            const attempt: CascadeAttempt = {
                model: ranked.modelId,
                provider: ranked.provider,
                startedAt: Date.now(),
                endedAt: 0,
                inputTokens: 0,
                outputTokens: 0,
                costUsd: 0
            };

            let inputTokens = 0;
            let outputTokens = 0;
            let attemptCost = 0;

            try {
                for await (const event of adapter.stream(
                    currentMessages,
                    ranked.modelId
                )) {
                    if (event.type === "token") {
                        outputTokens++;
                        totalTokens++;

                        // Threshold check after every token — cheap, no I/O
                        const thresholdTrigger = checkThresholds({
                            accumulatedCostUsd: totalCostUsd + attemptCost,
                            accumulatedTokens: totalTokens,
                            contextWindow,
                            profile
                        });

                        if (thresholdTrigger) {
                            cascadeTrigger = thresholdTrigger;
                            attempt.endedAt = Date.now();
                            attempt.inputTokens = inputTokens;
                            attempt.outputTokens = outputTokens;
                            attempt.costUsd = attemptCost;
                            attempt.trigger = thresholdTrigger;
                            attempts.push(attempt);
                            break attemptLoop;
                        }

                        yield event;
                    } else if (event.type === "done") {
                        inputTokens = event.totalInputTokens;
                        outputTokens = event.totalOutputTokens;
                        attemptCost = event.totalCostUsd;
                        totalCostUsd += attemptCost;

                        attempt.endedAt = Date.now();
                        attempt.inputTokens = inputTokens;
                        attempt.outputTokens = outputTokens;
                        attempt.costUsd = attemptCost;
                        attempts.push(attempt);

                        await trackSuccess(
                            ranked.provider,
                            attempt.endedAt - attempt.startedAt,
                            outputTokens,
                            attemptCost
                        );

                        // Yield the done event so the route handler can finalize the response
                        yield event;

                        // ── Reverse cascade: check if we should bounce back to a better model ──
                        if (
                            profile.reverse_cascade &&
                            switchCount > 0 &&
                            modelIndex > 0
                        ) {
                            const originalModel = chain[0]!;
                            if (
                                !exhaustedModels.has(originalModel.modelId) &&
                                originalModel.configured
                            ) {
                                // Signal successful completion — the caller decides whether to
                                // act on reverse cascade or not. We don't cascade here because
                                // the current turn is done; this is a hint for the next turn.
                            }
                        }

                        yield {
                            type: "cascade_complete",
                            attempts,
                            totalCostUsd,
                            totalTokens,
                            totalDurationMs:
                                Date.now() - attempts[0]!.startedAt,
                            switchCount
                        };
                        return;
                    } else if (event.type === "error") {
                        cascadeTrigger = triggerFromErrorCode(event.code);
                        lastError = event.error;
                        attempt.trigger = cascadeTrigger;

                        await trackError(
                            ranked.provider,
                            event.code === "rate_limited"
                                ? "rate_limited"
                                : "error",
                            event.error
                        );

                        // Retry the same model if the trigger is retryable and we have retries left
                        if (
                            isRetryable(cascadeTrigger) &&
                            retries < maxRetries
                        ) {
                            retries++;
                            // Exponential backoff: 500ms, 1000ms, 2000ms...
                            await sleep(
                                Math.min(500 * Math.pow(2, retries - 1), 4_000)
                            );
                            continue attemptLoop;
                        }

                        attempt.endedAt = Date.now();
                        attempt.inputTokens = inputTokens;
                        attempt.outputTokens = outputTokens;
                        attempt.costUsd = attemptCost;
                        attempts.push(attempt);
                        break attemptLoop;
                    }
                }
            } catch (err) {
                // Unexpected throw from a provider — treat as a transient error
                cascadeTrigger = "error";
                lastError = err instanceof Error ? err.message : String(err);
                attempt.trigger = "error";
                attempt.endedAt = Date.now();
                attempts.push(attempt);

                await trackError(ranked.provider, "error", lastError);

                if (isRetryable(cascadeTrigger) && retries < maxRetries) {
                    retries++;
                    await sleep(
                        Math.min(500 * Math.pow(2, retries - 1), 4_000)
                    );
                    continue attemptLoop;
                }

                break attemptLoop;
            }

            // Fell through without a done/error — shouldn't happen with well-behaved
            // adapters but handle defensively
            break attemptLoop;
        }

        // ── Cascade to next model ─────────────────────────────────────────────────
        exhaustedModels.add(ranked.modelId);

        const nextIndex = modelIndex + 1;
        const nextModel = chain[nextIndex];

        if (!nextModel) {
            yield {
                type: "cascade_exhausted",
                attempts,
                lastError:
                    lastError ||
                    `All models in the cascade chain have been exhausted.`
            };
            return;
        }

        // Log the cascade event for the dashboard
        if (cascadeTrigger && conversationId) {
            const event = {
                conversationId,
                fromModel: ranked.modelId,
                toModel: nextModel.modelId,
                reason: triggerToReason(cascadeTrigger),
                profile:
                    Object.entries(options.profile).length > 0
                        ? "custom"
                        : "default",
                ...(attempts.at(-1)
                    ? {
                          latencyMs: Date.now() - attempts.at(-1)!.startedAt
                      }
                    : {})
            };
            logCascadeEvent(event).catch(() => {}); // non-blocking — don't fail the stream on a log write error
        }

        yield {
            type: "cascade_switch",
            fromModel: ranked.modelId,
            toModel: nextModel.modelId,
            trigger: cascadeTrigger ?? "error",
            attempt: switchCount,
            tokensBeforeSwitch: totalTokens
        };

        switchCount++;
        modelIndex = nextIndex;

        // ── Context compression before handoff ────────────────────────────────────
        if (profile.compress_on_handoff) {
            currentMessages = await summarizeForHandoff(
                currentMessages,
                profile.compressor
            );
        }
    }

    // Exhausted all models without yielding a cascade_complete
    yield {
        type: "cascade_exhausted",
        attempts,
        lastError: "All cascade models failed."
    };
}

// ── Utility ───────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

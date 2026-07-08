import {
    getHealthScore,
    computeHealthScore,
    getUsageStat
} from "@db/redis/redis.usage";
import { getChatAdapterForModel } from "@providers/chat/chat.registry";

export interface RankedModel {
    modelId: string;
    provider: string;
    healthScore: number;
    configured: boolean;
}

/**
 * Builds the candidate model chain for a cascade run.
 *
 * Order of operations:
 * 1. Filter models in the profile chain to those whose provider adapter exists
 * 2. Fetch live health scores from Redis for all configured models in parallel
 * 3. Sort by health score descending — healthiest model goes first
 * 4. Unconfigured models are pushed to the end (not dropped) so the engine can
 *    emit a proper 'unconfigured' cascade event and keep attempting others
 * 5. If the caller's preferred model is in the chain, promote it to position 0
 *    regardless of its health score — the user's explicit choice takes priority
 *    over the automated ranking. The engine will still cascade away from it if
 *    it fails.
 *
 * This is intentionally strict: every model in the profile chain is evaluated,
 * not just those the engine happens to know about at call time. Unknown models
 * (e.g. a typo in conduit.config.toml) surface as 'unconfigured' events rather
 * than silently disappearing.
 */
export async function buildRankedChain(
    chain: string[],
    preferredModel: string
): Promise<RankedModel[]> {
    const scored = await Promise.all(
        chain.map(async (modelId): Promise<RankedModel> => {
            const adapter = getChatAdapterForModel(modelId);
            const configured = !!adapter && adapter.isConfigured();
            const provider = adapter?.id ?? modelId.split("/")[0] ?? modelId;

            if (!configured) {
                return {
                    modelId,
                    provider,
                    healthScore: -1,
                    configured: false
                };
            }

            const score = await getHealthScore(provider);
            return { modelId, provider, healthScore: score, configured: true };
        })
    );

    // Stable sort: configured models ranked by health, unconfigured at the end
    const ranked = scored.sort((a, b) => {
        if (a.configured && !b.configured) return -1;
        if (!a.configured && b.configured) return 1;
        return b.healthScore - a.healthScore;
    });

    // Promote the preferred model to position 0 if it's in the chain
    const preferredIdx = ranked.findIndex(m => m.modelId === preferredModel);
    if (preferredIdx > 0) {
        const [preferred] = ranked.splice(preferredIdx, 1);
        ranked.unshift(preferred!);
    }

    return ranked;
}

/**
 * Determines whether the current stream state should trigger a cascade based
 * on the profile's cost and token thresholds.
 *
 * Called after every completed token chunk — designed to be cheap (no I/O).
 * Returns the trigger reason if a threshold is crossed, null otherwise.
 */
export function checkThresholds(params: {
    accumulatedCostUsd: number;
    accumulatedTokens: number;
    contextWindow: number;
    profile: import("@config/config.schema").CascadeProfile;
}): "cost_cap" | "token_threshold" | null {
    const { accumulatedCostUsd, accumulatedTokens, contextWindow, profile } =
        params;

    if (
        profile.cost_cap_usd > 0 &&
        accumulatedCostUsd >= profile.cost_cap_usd
    ) {
        return "cost_cap";
    }

    if (contextWindow > 0) {
        const fraction = accumulatedTokens / contextWindow;
        if (fraction >= profile.token_threshold) {
            return "token_threshold";
        }
    }

    return null;
}

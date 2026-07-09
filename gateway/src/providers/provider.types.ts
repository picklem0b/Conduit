// ── Shared primitives ─────────────────────────────────────────────────────────

export type ProviderStatus =
    | "active"
    | "invalid_key"
    | "rate_limited"
    | "unreachable"
    | "unconfigured"
    | "provider_down";
export type ProviderCategory = "chat" | "image" | "search" | "code";
export type ModelCapability =
    | "chat"
    | "vision"
    | "function_calling"
    | "json_mode"
    | "streaming";

// ── Model descriptor ──────────────────────────────────────────────────────────

export interface Model {
    readonly id: string;
    readonly name: string;
    readonly provider: string;
    readonly category: ProviderCategory;
    readonly capabilities: ModelCapability[];
    readonly contextWindow: number;
    /** Input cost per 1M tokens in USD */
    readonly inputCostPer1M: number;
    /** Output cost per 1M tokens in USD */
    readonly outputCostPer1M: number;
    readonly maxOutputTokens: number;
}

// ── Provider health ───────────────────────────────────────────────────────────

export interface ProbeResult {
    status: ProviderStatus;
    latencyMs: number;
    modelsAvailable: number;
    error?: string;
}

export interface ProviderHealth {
    readonly provider: string;
    readonly name: string;
    readonly category: ProviderCategory;
    readonly status: ProviderStatus;
    readonly keyHint: string;
    readonly latencyMs: number;
    readonly modelsAvailable: number;
    readonly capabilities: ModelCapability[];
    readonly lastChecked: number;
    readonly error?: string;
}

// ── Chat types ────────────────────────────────────────────────────────────────

export type MessageRole = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
    role: MessageRole;
    content: string;
    name?: string;
    toolCallId?: string;
}

export interface StreamOptions {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    systemPrompt?: string;
    tools?: ToolDefinition[];
}

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
}

// ── Stream events ─────────────────────────────────────────────────────────────

export type StreamErrorCode =
    | "invalid_key"
    | "rate_limited"
    | "context_length"
    | "provider_down"
    | "timeout"
    | "unknown";

export interface StreamTokenEvent {
    type: "token";
    content: string;
    /** Cumulative output tokens so far */
    tokens: number;
}

export interface StreamDoneEvent {
    type: "done";
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCostUsd: number;
    durationMs: number;
    model: string;
    finishReason:
        | "stop"
        | "length"
        | "tool_calls"
        | "content_filter"
        | "unknown";
}

export interface StreamErrorEvent {
    type: "error";
    code: StreamErrorCode;
    error: string;
    retryable: boolean;
}

export type StreamEvent = StreamTokenEvent | StreamDoneEvent | StreamErrorEvent;

// ── Image types ───────────────────────────────────────────────────────────────

export interface ImageModel {
    readonly id: string;
    readonly name: string;
    readonly provider: string;
    readonly supportedSizes: string[];
    readonly supportedFormats: string[];
    readonly costPerImageUsd: number;
}

export interface ImageGenerateOptions {
    size?: string;
    quality?: "standard" | "hd";
    format?: "url" | "base64";
    count?: number;
    style?: string;
    negativePrompt?: string;
}

export interface ImageResult {
    url?: string;
    base64?: string;
    mimeType?: string;
    revisedPrompt?: string;
    seed?: number;
}

// ── Search types ──────────────────────────────────────────────────────────────

export interface SearchOptions {
    count?: number;
    country?: string;
    language?: string;
    safeSearch?: boolean;
    freshness?: "day" | "week" | "month";
}

export interface SearchResult {
    title: string;
    url: string;
    snippet: string;
    source?: string;
    publishedAt?: string;
    imageUrl?: string;
    rank: number;
}

// ── Cost estimation ───────────────────────────────────────────────────────────

export function estimateCost(
    model: Pick<Model, "inputCostPer1M" | "outputCostPer1M">,
    inputTokens: number,
    outputTokens: number
): number {
    return (
        (inputTokens / 1_000_000) * model.inputCostPer1M +
        (outputTokens / 1_000_000) * model.outputCostPer1M
    );
}

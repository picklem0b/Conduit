export type Tab =
    | "status"
    | "chat"
    | "keys"
    | "providers"
    | "discovery"
    | "media"
    | "search"
    | "code";

export interface HealthResp {
    status: "ok";
    timestamp: string;
}
export interface ServiceEntry {
    name: string;
    status: "operational" | "degraded" | "down";
    latencyMs: number | null;
}
export interface MirrorEntry {
    label: string;
    url: string;
    status: "operational" | "degraded" | "down";
    latencyMs: number | null;
}
export interface StatusResp {
    overall: "operational" | "degraded" | "outage";
    checkedAt: number;
    services: ServiceEntry[];
    mirrors: MirrorEntry[];
}
export interface ProviderHealth {
    id: string;
    configured: boolean;
    healthy: boolean;
    latencyMs?: number;
    modelCount?: number;
}
export interface Model {
    id: string;
    name: string;
    contextWindow?: number;
}
export interface ModelsResp {
    chat: Model[];
    image: Model[];
}
export interface KeyMeta {
    provider: string;
    hint: string;
    savedAt: string;
}
export interface SSEEvent {
    type: string;
    [key: string]: unknown;
}

export const PROVIDERS = [
    "anthropic",
    "openai",
    "google",
    "groq",
    "stability",
    "serpapi",
    "brave"
] as const;
export type ProviderId = (typeof PROVIDERS)[number];

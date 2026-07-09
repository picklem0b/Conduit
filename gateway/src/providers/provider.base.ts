import type {
    Model,
    ProbeResult,
    ProviderCategory,
    ProviderHealth,
    ModelCapability
} from "./provider.types";
import { getKey, getKeyHint } from "@db/stores/key.store";

/**
 * Abstract base every provider adapter extends. Enforces the contract that
 * all adapters must satisfy:
 *
 * - `id`          — stable machine identifier, used as the database key
 * - `name`        — human-readable display name
 * - `category`    — determines which route group this adapter belongs to
 * - `isConfigured()` — fast synchronous check; no I/O
 * - `probe()`     — live health check against the provider's API
 * - `listModels()` — list of models this adapter exposes
 *
 * Concrete adapters extend this class and implement the category-specific
 * streaming/generation interface on top.
 */
export abstract class BaseProvider<TModel = Model> {
    abstract readonly id: string;
    abstract readonly name: string;
    abstract readonly category: ProviderCategory;

    /**
     * Returns true if a key is available for this provider — either from the
     * database, a temporary probe override, or the environment. This is a
     * synchronous hot-path check used by the cascade engine on every request.
     */
    isConfigured(): boolean {
        return typeof getKey(this.id) === "string";
    }

    /**
     * Returns the configured API key for this provider.
     * Throws if no key is configured — call `isConfigured()` first.
     */
    protected getApiKey(): string {
        const key = getKey(this.id);
        if (!key) {
            throw new Error(
                `[${this.id}] No API key configured. Add one via the UI or set the environment variable.`
            );
        }
        return key;
    }

    abstract listModels(): TModel[];
    abstract probe(): Promise<ProbeResult>;

    /**
     * Returns a sanitized health snapshot suitable for the /api/providers/health
     * endpoint and the runtime dashboard.
     */
    async getHealth(): Promise<ProviderHealth> {
        const probe = await this.probe();
        const models = this.listModels();
        const capabilities: ModelCapability[] =
            this.category === "image"
                ? []
                : Array.from(
                      new Set<ModelCapability>(
                          (models as Model[]).flatMap(m => m.capabilities)
                      )
                  );

        const health: ProviderHealth = {
            provider: this.id,
            name: this.name,
            category: this.category,
            status: probe.status,
            keyHint: getKeyHint(this.id),
            latencyMs: probe.latencyMs,
            modelsAvailable: probe.modelsAvailable,
            capabilities,
            lastChecked: Date.now()
        };

        if (probe.error !== undefined) {
            (health as { error?: string }).error = probe.error;
        }

        return health;
    }

    /**
     * Builds a standard request timeout signal. Provider adapters use this to
     * abort long-running fetch calls rather than hanging indefinitely.
     */
    protected timeoutSignal(ms = 30_000): AbortSignal {
        return AbortSignal.timeout(ms);
    }

    /**
     * Maps common HTTP status codes and error messages to typed StreamErrorCodes.
     * Avoids duplicating this logic in every adapter.
     */
    protected classifyHttpError(
        status: number,
        body: string
    ): import("./provider.types").StreamErrorCode {
        if (status === 401 || status === 403) return "invalid_key";
        if (status === 429) return "rate_limited";
        if (status === 413 || body.toLowerCase().includes("context"))
            return "context_length";
        if (status >= 500) return "provider_down";
        return "unknown";
    }
}

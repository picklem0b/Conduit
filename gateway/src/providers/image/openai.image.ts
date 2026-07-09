import { BaseProvider } from "../provider.base";
import { readErrorBody } from "../provider.sse";
import { getKey } from "@db/stores/key.store";
import type {
    ImageModel,
    ImageGenerateOptions,
    ImageResult,
    ProbeResult
} from "../provider.types";

const MODELS: ImageModel[] = [
    {
        id: "dall-e-3",
        name: "DALL-E 3",
        provider: "openai-images",
        supportedSizes: ["1024x1024", "1792x1024", "1024x1792"],
        supportedFormats: ["url", "base64"],
        costPerImageUsd: 0.04
    },
    {
        id: "dall-e-2",
        name: "DALL-E 2",
        provider: "openai-images",
        supportedSizes: ["256x256", "512x512", "1024x1024"],
        supportedFormats: ["url", "base64"],
        costPerImageUsd: 0.02
    }
];

const MODEL_MAP = new Map(MODELS.map(m => [m.id, m]));
const API_BASE = "https://api.openai.com";

interface DalleResponse {
    data: {
        url?: string;
        b64_json?: string;
        revised_prompt?: string;
    }[];
}

export class OpenAIImagesProvider extends BaseProvider<ImageModel> {
    readonly id = "openai-images";
    readonly name = "OpenAI Images";
    readonly category = "image" as const;

    // OpenAI Images shares the OpenAI key — check both
    isConfigured(): boolean {
        return !!(getKey("openai-images") ?? getKey("openai"));
    }

    protected getApiKey(): string {
        const key = getKey("openai-images") ?? getKey("openai");
        if (!key) throw new Error("[openai-images] No API key configured");
        return key;
    }

    override listModels(): ImageModel[] {
        return MODELS;
    }

    listImageModels(): ImageModel[] {
        return MODELS;
    }

    async probe(): Promise<ProbeResult> {
        const started = Date.now();
        if (!this.isConfigured())
            return { status: "unconfigured", latencyMs: 0, modelsAvailable: 0 };

        try {
            const response = await fetch(`${API_BASE}/v1/models`, {
                headers: { Authorization: `Bearer ${this.getApiKey()}` },
                signal: this.timeoutSignal(8_000)
            });
            const latencyMs = Date.now() - started;
            if (response.status === 401)
                return {
                    status: "invalid_key",
                    latencyMs,
                    modelsAvailable: 0,
                    error: "Invalid API key"
                };
            if (response.status === 429)
                return {
                    status: "rate_limited",
                    latencyMs,
                    modelsAvailable: 0,
                    error: "Rate limited"
                };
            if (!response.ok)
                return {
                    status: "provider_down" as const,
                    latencyMs,
                    modelsAvailable: 0,
                    error: `HTTP ${response.status}`
                };
            return {
                status: "active",
                latencyMs,
                modelsAvailable: MODELS.length
            };
        } catch (err) {
            return {
                status: "unreachable",
                latencyMs: Date.now() - started,
                modelsAvailable: 0,
                error: err instanceof Error ? err.message : "Unknown error"
            };
        }
    }

    async generate(
        prompt: string,
        modelId: string,
        options: ImageGenerateOptions = {}
    ): Promise<ImageResult[]> {
        const model = MODEL_MAP.get(modelId);
        if (!model) throw new Error(`Unknown OpenAI image model: ${modelId}`);

        const size = options.size ?? "1024x1024";
        if (!model.supportedSizes.includes(size)) {
            throw new Error(
                `Model ${modelId} does not support size ${size}. Supported: ${model.supportedSizes.join(", ")}`
            );
        }

        const response = await fetch(`${API_BASE}/v1/images/generations`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.getApiKey()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: modelId,
                prompt,
                n: Math.min(options.count ?? 1, modelId === "dall-e-3" ? 1 : 4),
                size,
                quality: options.quality ?? "standard",
                response_format: options.format ?? "url"
            }),
            signal: this.timeoutSignal(120_000)
        });

        if (!response.ok) {
            const errorBody = await readErrorBody(response);
            throw new Error(
                `OpenAI Images error (${response.status}): ${errorBody}`
            );
        }

        const data = (await response.json()) as DalleResponse;
        return data.data.map(d => ({
            ...(d.url !== undefined ? { url: d.url } : {}),
            ...(d.b64_json !== undefined ? { base64: d.b64_json } : {}),
            ...(d.revised_prompt !== undefined
                ? { revisedPrompt: d.revised_prompt }
                : {})
        })) as ImageResult[];
    }
}

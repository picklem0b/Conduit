import { BaseProvider } from "../provider.base";
import { readErrorBody } from "../provider.sse";
import type {
    ImageModel,
    ImageGenerateOptions,
    ImageResult,
    ProbeResult
} from "../provider.types";

const MODELS: ImageModel[] = [
    {
        id: "stable-diffusion-3-large",
        name: "Stable Diffusion 3 Large",
        provider: "stability",
        supportedSizes: [
            "1024x1024",
            "1152x896",
            "896x1152",
            "1216x832",
            "832x1216",
            "1344x768",
            "768x1344"
        ],
        supportedFormats: ["url", "base64"],
        costPerImageUsd: 0.065
    },
    {
        id: "stable-diffusion-xl-1024-v1-0",
        name: "Stable Diffusion XL",
        provider: "stability",
        supportedSizes: ["1024x1024", "1152x896", "896x1152"],
        supportedFormats: ["url", "base64"],
        costPerImageUsd: 0.02
    }
];

const MODEL_MAP = new Map(MODELS.map(m => [m.id, m]));
const API_BASE = "https://api.stability.ai";

export class StabilityProvider extends BaseProvider<ImageModel> {
    readonly id = "stability";
    readonly name = "Stability AI";
    readonly category = "image" as const;

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
            const response = await fetch(`${API_BASE}/v1/user/account`, {
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
        if (!model) throw new Error(`Unknown Stability model: ${modelId}`);

        const [width, height] = (options.size ?? "1024x1024")
            .split("x")
            .map(Number);

        const response = await fetch(
            `${API_BASE}/v1/generation/${modelId}/text-to-image`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.getApiKey()}`,
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                body: JSON.stringify({
                    text_prompts: [
                        { text: prompt, weight: 1 },
                        ...(options.negativePrompt
                            ? [{ text: options.negativePrompt, weight: -1 }]
                            : [])
                    ],
                    width,
                    height,
                    samples: options.count ?? 1,
                    steps: 30
                }),
                signal: this.timeoutSignal(120_000)
            }
        );

        if (!response.ok) {
            const errorBody = await readErrorBody(response);
            throw new Error(
                `Stability AI error (${response.status}): ${errorBody}`
            );
        }

        const data = (await response.json()) as {
            artifacts: { base64: string; seed: number; finishReason: string }[];
        };

        return data.artifacts
            .filter(a => a.finishReason === "SUCCESS")
            .map(a => ({
                base64: a.base64,
                mimeType: "image/png",
                seed: a.seed
            }));
    }
}

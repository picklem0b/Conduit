import { z } from "zod";
import type { Context } from "hono";
import {
    getImageAdapter,
    allImageModels
} from "@providers/image/media.registry";
import type { ImageProviderAdapter } from "@providers/image/media.types";
import { checkRateLimit } from "@db/redis/redis.ratelimit";
import { recordSuccess, recordError } from "@db/redis/redis.usage";

// ── Validation ────────────────────────────────────────────────────────────────

const GenerateImageSchema = z.object({
    prompt: z.string().min(1).max(4000),
    model: z.string().min(1),
    size: z
        .string()
        .regex(/^\d+x\d+$/, "Size must be in WxH format e.g. 1024x1024")
        .optional(),
    count: z.number().int().min(1).max(4).optional().default(1),
    quality: z.enum(["standard", "hd"]).optional().default("standard"),
    format: z.enum(["url", "base64"]).optional().default("url"),
    negativePrompt: z.string().max(2000).optional(),
    style: z.string().optional()
});

type GenerateImageInput = z.infer<typeof GenerateImageSchema>;

// ── Model → provider resolution ───────────────────────────────────────────────

/**
 * Resolves a model ID to its image provider adapter.
 * Image models use the registry's `allImageModels()` to build a model→provider
 * map at call time (tiny — only 4 models total across 2 providers).
 */
function getImageAdapterForModel(modelId: string): ImageProviderAdapter | null {
    const models = allImageModels();
    const model = models.find(m => m.id === modelId);
    if (!model) return null;

    const adapter = getImageAdapter(model.provider);
    if (!adapter) return null;

    // All image adapters implement ImageProviderAdapter — safe cast
    return adapter as unknown as ImageProviderAdapter;
}

// ── POST /api/media/generate ──────────────────────────────────────────────────

/**
 * Generates images using any configured image provider.
 * Returns an array of image results — each has either `url` or `base64`
 * depending on the requested format, plus optional `revisedPrompt` and `seed`.
 *
 * Rate limited to 20 requests/minute per IP — image generation is expensive.
 */
export async function handleGenerateImage(c: Context): Promise<Response> {
    // ── Rate limit ─────────────────────────────────────────────────────────────
    const ip =
        c.req.header("CF-Connecting-IP") ??
        c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ??
        "unknown";

    const rl = await checkRateLimit(ip, "media.generate", 20, 60_000);
    if (!rl.allowed) {
        return c.json(
            {
                error: "Too many image generation requests. Please wait.",
                code: "rate_limited",
                retryAfterMs: rl.retryAfterMs
            },
            429
        );
    }

    // ── Validate ───────────────────────────────────────────────────────────────
    let body: GenerateImageInput;
    try {
        const raw = await c.req.json();
        body = GenerateImageSchema.parse(raw);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return c.json(
                {
                    error: "Validation failed",
                    code: "validation_error",
                    detail: err.issues
                },
                422
            );
        }
        return c.json({ error: "Invalid JSON body", code: "bad_request" }, 400);
    }

    // ── Resolve provider ───────────────────────────────────────────────────────
    const adapter = getImageAdapterForModel(body.model);
    if (!adapter) {
        return c.json(
            {
                error: `Unknown image model: "${body.model}"`,
                code: "unknown_model",
                availableModels: allImageModels().map(m => m.id)
            },
            400
        );
    }

    if (!adapter.isConfigured()) {
        return c.json(
            {
                error: `Image provider for model "${body.model}" has no API key configured. Add one via Settings.`,
                code: "unconfigured_provider"
            },
            400
        );
    }

    // ── Generate ───────────────────────────────────────────────────────────────
    const started = Date.now();
    try {
        const results = await adapter.generate(body.prompt, body.model, {
            count: body.count,
            quality: body.quality,
            format: body.format,
            ...(body.size !== undefined ? { size: body.size } : {}),
            ...(body.negativePrompt !== undefined
                ? { negativePrompt: body.negativePrompt }
                : {}),
            ...(body.style !== undefined ? { style: body.style } : {})
        });

        const durationMs = Date.now() - started;

        recordSuccess(adapter.id, durationMs).catch(() => {});

        return c.json({
            model: body.model,
            provider: adapter.id,
            images: results,
            count: results.length,
            durationMs
        });
    } catch (err) {
        const message =
            err instanceof Error ? err.message : "Image generation failed";

        recordError(adapter.id, "error", message).catch(() => {});

        return c.json({ error: message, code: "generation_failed" }, 502);
    }
}

// ── GET /api/media/models ─────────────────────────────────────────────────────

/**
 * Lists all available image models with their capabilities.
 */
export async function handleImageModels(c: Context): Promise<Response> {
    return c.json({ models: allImageModels() });
}

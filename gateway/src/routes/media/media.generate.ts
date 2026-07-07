import { z } from "zod";
import type { Context } from "hono";
import {
   getImageAdapterForModel,
   allImageModels
} from "@providers/image/media.registry";
import { checkRateLimit } from "@db/redis/redis.ratelimit";
import { incrementUsage } from "@db/redis/redis.usage";

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
   negativePrompt: z.string().max(2000).optional()
});

type GenerateImageInput = z.infer<typeof GenerateImageSchema>;

// ── POST /api/media/generate ──────────────────────────────────────────────────

/**
 * Generates images using any configured image provider.
 *
 * Returns an array of image results — each result has either a `url` or
 * `base64` field depending on the requested format, plus optional metadata
 * like `revisedPrompt` (DALL-E 3) and `seed` (Stability AI).
 *
 * Rate limited to 20 requests/minute per IP — image generation is expensive
 * in both cost and compute.
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
      const available = allImageModels().map(m => m.id);
      return c.json(
         {
            error: `Unknown image model: "${body.model}"`,
            code: "unknown_model",
            availableModels: available
         },
         400
      );
   }

   if (!adapter.isConfigured()) {
      return c.json(
         {
            error: `Image provider for "${body.model}" has no API key configured. Add one via Settings.`,
            code: "unconfigured_provider"
         },
         400
      );
   }

   // ── Generate ───────────────────────────────────────────────────────────────
   const started = Date.now();
   try {
      const results = await adapter.generate(body.prompt, body.model, {
         size: body.size,
         count: body.count,
         quality: body.quality,
         format: body.format,
         negativePrompt: body.negativePrompt
      });

      const durationMs = Date.now() - started;

      // Fire-and-forget usage tracking
      incrementUsage(adapter.id, {
         requests: 1,
         latencyMs: durationMs
      }).catch(() => {});

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

      // Track error
      incrementUsage(adapter.id, { requests: 1, errors: 1 }).catch(() => {});

      return c.json({ error: message, code: "generation_failed" }, 502);
   }
}

// ── GET /api/media/models ─────────────────────────────────────────────────────

/**
 * Lists all available image models with their capabilities (sizes, formats, cost).
 */
export async function handleImageModels(c: Context): Promise<Response> {
   return c.json({ models: allImageModels() });
}

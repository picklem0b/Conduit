import { z } from "zod";
import type { Context } from "hono";
import {
   getSearchAdapter,
   allSearchProviders
} from "@providers/search/search.registry";
import { checkRateLimit } from "@db/redis/redis.ratelimit";
import { incrementUsage } from "@db/redis/redis.usage";

// ── Validation ────────────────────────────────────────────────────────────────

const SearchQuerySchema = z.object({
   query: z.string().min(1).max(500),
   /** Specific provider to use. If omitted, uses the first configured provider. */
   provider: z.string().optional(),
   count: z.number().int().min(1).max(50).optional().default(10),
   country: z.string().length(2).optional(),
   language: z.string().max(10).optional(),
   freshness: z.string().optional(),
   safeSearch: z.boolean().optional().default(true)
});

type SearchQueryInput = z.infer<typeof SearchQuerySchema>;

// ── POST /api/search ──────────────────────────────────────────────────────────

/**
 * Executes a web search using the configured search provider (SerpAPI or
 * Brave Search). If multiple providers are configured, the `provider` field
 * selects which to use; otherwise the first available is chosen.
 *
 * Rate limited to 30 requests/minute per IP.
 */
export async function handleSearch(c: Context): Promise<Response> {
   // ── Rate limit ─────────────────────────────────────────────────────────────
   const ip =
      c.req.header("CF-Connecting-IP") ??
      c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ??
      "unknown";

   const rl = await checkRateLimit(ip, "search.query", 30, 60_000);
   if (!rl.allowed) {
      return c.json(
         {
            error: "Too many search requests. Please wait.",
            code: "rate_limited",
            retryAfterMs: rl.retryAfterMs
         },
         429
      );
   }

   // ── Validate ───────────────────────────────────────────────────────────────
   let body: SearchQueryInput;
   try {
      const raw = await c.req.json();
      body = SearchQuerySchema.parse(raw);
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
   const adapter = body.provider
      ? getSearchAdapter(body.provider)
      : (allSearchProviders().find(p => p.isConfigured()) ?? null);

   if (!adapter) {
      const configured = allSearchProviders()
         .filter(p => p.isConfigured())
         .map(p => p.id);

      return c.json(
         {
            error: body.provider
               ? `Unknown search provider: "${body.provider}"`
               : "No search provider is configured. Add a SerpAPI or Brave Search key via Settings.",
            code: "unconfigured_provider",
            configuredProviders: configured
         },
         400
      );
   }

   if (!adapter.isConfigured()) {
      return c.json(
         {
            error: `Search provider "${adapter.id}" has no API key configured.`,
            code: "unconfigured_provider"
         },
         400
      );
   }

   // ── Search ─────────────────────────────────────────────────────────────────
   const started = Date.now();
   try {
      const results = await adapter.search(body.query, {
         count: body.count,
         country: body.country,
         language: body.language,
         freshness: body.freshness,
         safeSearch: body.safeSearch
      });

      const durationMs = Date.now() - started;

      incrementUsage(adapter.id, {
         requests: 1,
         latencyMs: durationMs
      }).catch(() => {});

      return c.json({
         query: body.query,
         provider: adapter.id,
         results,
         count: results.length,
         durationMs
      });
   } catch (err) {
      const message = err instanceof Error ? err.message : "Search failed";

      incrementUsage(adapter.id, { requests: 1, errors: 1 }).catch(() => {});

      return c.json({ error: message, code: "search_failed" }, 502);
   }
}

// ── GET /api/search/providers ─────────────────────────────────────────────────

/**
 * Lists all known search providers and whether each is configured.
 */
export async function handleSearchProviders(c: Context): Promise<Response> {
   const providers = allSearchProviders().map(p => ({
      id: p.id,
      name: p.name,
      configured: p.isConfigured()
   }));

   return c.json({ providers });
}

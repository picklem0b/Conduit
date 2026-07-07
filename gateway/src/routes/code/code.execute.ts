import { z } from "zod";
import type { Context } from "hono";
import {
   executeCode,
   isCodeExecutionConfigured,
   SUPPORTED_RUNTIMES
} from "@providers/code/code.registry";
import { isSupportedRuntime } from "@providers/code/code.types";
import { checkRateLimit } from "@db/redis/redis.ratelimit";

// ── Validation ────────────────────────────────────────────────────────────────

const ExecuteSchema = z.object({
   code: z.string().min(1).max(100_000, "Code must be under 100KB"),
   runtime: z.string().min(1),
   timeoutMs: z.number().int().min(1_000).max(30_000).optional(),
   env: z.record(z.string()).optional()
});

// ── POST /api/code/execute ────────────────────────────────────────────────────

/**
 * Executes code in an isolated E2B sandbox.
 *
 * Rate limited to 10 executions/minute per IP — sandbox creation is
 * resource-intensive and billed by E2B per second of compute.
 *
 * The execution is synchronous from the client's perspective (waits for
 * completion), but uses an isolated throwaway sandbox with a hard timeout.
 * No state is shared between calls.
 */
export async function handleCodeExecute(c: Context): Promise<Response> {
   // ── Rate limit ─────────────────────────────────────────────────────────────
   const ip =
      c.req.header("CF-Connecting-IP") ??
      c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ??
      "unknown";

   const rl = await checkRateLimit(ip, "code.execute", 10, 60_000);
   if (!rl.allowed) {
      return c.json(
         {
            error: "Too many code execution requests. Please wait.",
            code: "rate_limited",
            retryAfterMs: rl.retryAfterMs
         },
         429
      );
   }

   // ── Check E2B configured ───────────────────────────────────────────────────
   if (!isCodeExecutionConfigured()) {
      return c.json(
         {
            error: "Code execution is not configured. Add an E2B API key via Settings → Providers.",
            code: "unconfigured_provider"
         },
         400
      );
   }

   // ── Validate ───────────────────────────────────────────────────────────────
   let body: z.infer<typeof ExecuteSchema>;
   try {
      const raw = await c.req.json();
      body = ExecuteSchema.parse(raw);
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

   if (!isSupportedRuntime(body.runtime)) {
      return c.json(
         {
            error: `Unsupported runtime: "${body.runtime}"`,
            code: "unsupported_runtime",
            supportedRuntimes: SUPPORTED_RUNTIMES
         },
         400
      );
   }

   // ── Execute ────────────────────────────────────────────────────────────────
   try {
      const result = await executeCode(body.code, body.runtime, {
         timeoutMs: body.timeoutMs,
         env: body.env
      });

      return c.json(result);
   } catch (err) {
      const message = err instanceof Error ? err.message : "Execution failed";
      return c.json({ error: message, code: "execution_failed" }, 502);
   }
}

// ── GET /api/code/runtimes ────────────────────────────────────────────────────

export async function handleCodeRuntimes(c: Context): Promise<Response> {
   return c.json({
      runtimes: SUPPORTED_RUNTIMES,
      configured: isCodeExecutionConfigured()
   });
}

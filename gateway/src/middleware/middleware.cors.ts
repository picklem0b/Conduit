import type { MiddlewareHandler } from "hono";
import { loadConfig } from "@config/config.loader";

// ── Allowed origins ────────────────────────────────────────────────────────────

/**
 * Builds the allow-list of origins from the conduit.config.toml [sites] table.
 * Conduit is self-hosted — every configured site hostname is a legitimate
 * origin. The list is computed once per config load; config hot-reload in dev
 * means this stays current without a restart.
 *
 * In development the wildcard is always included so Vite dev servers on any
 * port work without additional config.
 */
function getAllowedOrigins(): Set<string> {
    const config = loadConfig();
    const origins = new Set<string>();

    for (const host of Object.keys(config.sites)) {
        origins.add(`https://${host}`);
        origins.add(`http://${host}`);
    }

    // Always allow localhost variants for local development
    for (const port of [3000, 3001, 4000, 5173, 5174, 8080]) {
        origins.add(`http://localhost:${port}`);
        origins.add(`http://127.0.0.1:${port}`);
        origins.add(`http://0.0.0.0:${port}`);
    }

    return origins;
}

// ── Middleware ─────────────────────────────────────────────────────────────────

/**
 * CORS middleware for Conduit's gateway. Allows cross-origin requests from
 * any configured site hostname and all localhost origins in development.
 *
 * Design rationale:
 * - Conduit is self-hosted — there is no "third-party" origin in the
 *   traditional sense. The gateway and interfaces run on the same machine or
 *   cluster owned by the user.
 * - In production, we still restrict to known origins from conduit.config.toml
 *   to prevent rogue pages on shared hosts from probing the gateway.
 * - Credentials (cookies) are not used — Conduit uses no session cookies, so
 *   `credentials: 'include'` is never needed by the interfaces.
 * - SSE endpoints need the `Cache-Control` header exposed so clients can
 *   distinguish cached responses from live streams.
 */
export const corsMiddleware: MiddlewareHandler = async (c, next) => {
    const origin = c.req.header("Origin");
    const isDev = process.env.NODE_ENV !== "production";

    let allowOrigin = "";

    if (isDev) {
        // Reflect the origin back in dev — Vite HMR, arbitrary local ports
        allowOrigin = origin ?? "*";
    } else if (origin) {
        const allowed = getAllowedOrigins();
        allowOrigin = allowed.has(origin) ? origin : "";
    }

    // Preflight
    if (c.req.method === "OPTIONS") {
        if (allowOrigin) {
            c.header("Access-Control-Allow-Origin", allowOrigin);
            c.header(
                "Access-Control-Allow-Methods",
                "GET, POST, PUT, DELETE, OPTIONS"
            );
            c.header(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization, X-Request-ID, Cache-Control"
            );
            c.header("Access-Control-Max-Age", "86400");
            if (origin) c.header("Vary", "Origin");
        }
        return c.body(null, 204);
    }

    await next();

    if (allowOrigin) {
        c.header("Access-Control-Allow-Origin", allowOrigin);
        c.header(
            "Access-Control-Expose-Headers",
            "Content-Type, Cache-Control, X-Request-ID"
        );
        if (origin) c.header("Vary", "Origin");
    }
};

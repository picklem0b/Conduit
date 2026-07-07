import { Hono } from "hono";
import { createSocketHandlers } from "./websocket/socket.hub";

// ── Middleware ─────────────────────────────────────────────────────────────────
import { corsMiddleware } from "./middleware/middleware.cors";
import {
   requestIdMiddleware,
   errorHandler,
   notFoundHandler
} from "./middleware/middleware.error";
import { siteMiddleware } from "./middleware/middleware.site";
import { versionMiddleware } from "./middleware/middleware.version";

// ── Routes ────────────────────────────────────────────────────────────────────
import { keysRoute } from "./routes/keys/keys.route";
import {
   statusRoute,
   handleProvidersHealth,
   handleModels
} from "./routes/status/status.route";
import { sitesRoute } from "./routes/sites/sites.route";
import { licenseRoute } from "./routes/license/license.route";
import { discoveryRoute } from "./routes/discovery/discovery.route";
import { chatRoute } from "./routes/chat/chat.route";
import { mediaRoute } from "./routes/media/media.route";
import { searchRoute } from "./routes/search/search.route";
import { codeRoute } from "./routes/code/code.route";

// ── App factory ────────────────────────────────────────────────────────────────

/**
 * Creates and fully configures the Hono application.
 *
 * Separated from index.ts so the app can be imported in tests without
 * starting the Bun HTTP server or triggering startup side-effects.
 *
 * Middleware order (outermost → innermost):
 *   1. requestId   — stamps every request and response before anything else
 *   2. cors        — sets CORS headers (needs to run before any early returns)
 *   3. site        — resolves Host → SiteProfile, stored in context
 *   4. version     — blocks version-locked routes when update is required
 *
 * Route groups are mounted under /api/* with explicit path prefixes.
 * Version-locked routes are those under /api/chat, /api/media, /api/search,
 * /api/code, /api/discovery, /api/models, /api/providers — the version
 * middleware intercepts these before they reach their handlers.
 *
 * Public (never blocked):
 *   /api/health, /api/status, /api/keys, /api/sites/*, /api/license/*
 */
export function createApp(): Hono {
   const app = new Hono();

   // ── Global middleware ──────────────────────────────────────────────────────
   app.use("*", requestIdMiddleware);
   app.use("*", corsMiddleware);
   app.use("*", siteMiddleware);
   app.use("*", versionMiddleware);

   // ── Public routes ──────────────────────────────────────────────────────────

   // Liveness + public status
   app.route("/api", statusRoute);

   // Key management — always available so users can fix a broken config
   app.route("/api/keys", keysRoute);

   // Site config — needed by interfaces before they can render anything
   app.route("/api/sites", sitesRoute);

   // License — needed by UI to show update banners
   app.route("/api/license", licenseRoute);

   // ── Version-locked routes ──────────────────────────────────────────────────
   // versionMiddleware already intercepts these paths and returns 426 when
   // the installed version is below the minimum. The routes below only execute
   // when the version check passes.

   // Provider discovery (tester interface)
   app.route("/api/discovery", discoveryRoute);

   // Chat streaming + conversation history
   app.route("/api/chat", chatRoute);

   // Image generation
   app.route("/api/media", mediaRoute);

   // Web search
   app.route("/api/search", searchRoute);

   // Code execution (E2B sandboxes)
   app.route("/api/code", codeRoute);

   // Provider health + model list — version-locked, mounted directly
   app.get("/api/providers/health", handleProvidersHealth);
   app.get("/api/models", handleModels);

   // ── Error handling ─────────────────────────────────────────────────────────
   app.notFound(notFoundHandler);
   app.onError(errorHandler);

   return app;
}

// ── WebSocket handler export ───────────────────────────────────────────────────

/**
 * Bun WebSocket handlers. Exported so index.ts can pass them to Bun.serve().
 * Kept here (co-located with routing) rather than in index.ts so the
 * WebSocket upgrade logic stays close to the HTTP route definitions.
 */
export const socketHandlers = createSocketHandlers();

import { Hono } from "hono";
import { createSocketHandlers } from "./websocket/socket.hub";
import { createDocsApp } from "./openapi";

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
 *   1. requestId  — stamps every request/response before anything else
 *   2. cors       — sets CORS headers before any early returns
 *   3. site       — resolves Host → SiteProfile into context
 *   4. version    — blocks version-locked routes when update is required
 *
 * Public routes (never blocked by version middleware):
 *   /api/health, /api/status, /api/keys/*, /api/sites/*, /api/license/*
 *
 * Version-locked routes (return 426 when update_required):
 *   /api/chat/*, /api/media/*, /api/search/*, /api/code/*,
 *   /api/discovery/*, /api/models, /api/providers/*
 */
export function createApp(): Hono {
  const app = new Hono();

  // ── Swagger UI + OpenAPI spec — served at / and /openapi.json ────────────
  // Mounted before middleware so the docs page has no CORS/site/version overhead.
  app.route("/", createDocsApp());

  // ── Global middleware ──────────────────────────────────────────────────────
  app.use("*", requestIdMiddleware);
  app.use("*", corsMiddleware);
  app.use("*", siteMiddleware);
  app.use("*", versionMiddleware);

  // ── Public routes ──────────────────────────────────────────────────────────

  // GET /api/health  GET /api/status
  app.route("/api", statusRoute);

  // Key management — open so users can always fix a broken config
  app.route("/api/keys", keysRoute);

  // Site config — interfaces need this before they can render
  app.route("/api/sites", sitesRoute);

  // License — needed to show update banners regardless of version lock
  app.route("/api/license", licenseRoute);

  // ── Version-locked routes ──────────────────────────────────────────────────

  // Provider discovery (tester interface)
  app.route("/api/discovery", discoveryRoute);

  // Chat streaming + conversation history
  app.route("/api/chat", chatRoute);

  // Image generation
  app.route("/api/media", mediaRoute);

  // Web search
  app.route("/api/search", searchRoute);

  // Code execution
  app.route("/api/code", codeRoute);

  // Provider health + model catalogue — version-locked, mounted directly
  app.get("/api/providers/health", handleProvidersHealth);
  app.get("/api/models", handleModels);

  // ── Error handling ─────────────────────────────────────────────────────────
  app.notFound(notFoundHandler);
  app.onError(errorHandler);

  return app;
}

// ── WebSocket handler export ───────────────────────────────────────────────────

/**
 * Bun WebSocket handlers. Exported alongside createApp() so index.ts can
 * pass them directly to Bun.serve() without importing the websocket module
 * separately.
 */
export const socketHandlers = createSocketHandlers();
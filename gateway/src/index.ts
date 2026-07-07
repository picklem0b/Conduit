/**
 * Conduit Gateway — Entry Point
 *
 * Startup sequence:
 *   1. Load + validate conduit.config.toml
 *   2. Connect Postgres, run pending migrations
 *   3. Connect Redis
 *   4. Initial license check (if configured)
 *   5. Start license check loop
 *   6. Start config file watcher (dev only)
 *   7. Start Bun HTTP + WebSocket server
 *
 * Graceful shutdown (SIGTERM / SIGINT):
 *   - Stop accepting new connections
 *   - Stop license check loop
 *   - Stop config watcher
 *   - Drain Postgres pool
 *   - Close Redis connection
 */

import { loadConfig, watchConfig, unwatchConfig } from "./config/config.loader";
import { initPostgres, closePostgres } from "./db/postgres/postgres.client";
import { runMigrations } from "./db/postgres/postgres.migrate";
import { initRedis, closeRedis } from "./db/redis/redis.client";
import {
   checkLicense,
   startLicenseCheckLoop,
   stopLicenseCheckLoop
} from "./license/license.state";
import { createApp, socketHandlers } from "./server";

// ── Startup ────────────────────────────────────────────────────────────────────

async function start(): Promise<void> {
   console.log("[conduit] Starting gateway…");

   // ── 1. Config ──────────────────────────────────────────────────────────────
   let config: ReturnType<typeof loadConfig>;
   try {
      config = loadConfig();
      console.log(
         `[conduit] Config loaded (${config.gateway.host}:${config.gateway.port})`
      );
   } catch (err) {
      console.error("[conduit] Failed to load conduit.config.toml:", err);
      process.exit(1);
   }

   // ── 2. Postgres ────────────────────────────────────────────────────────────
   const pgUrl =
      process.env.DATABASE_URL ??
      `postgresql://${config.database.user}:${config.database.password}@${config.database.host}:${config.database.port}/${config.database.name}`;

   try {
      initPostgres(pgUrl);
      console.log("[conduit] Postgres connected");
   } catch (err) {
      console.error("[conduit] Postgres connection failed:", err);
      process.exit(1);
   }

   try {
      await runMigrations();
      console.log("[conduit] Migrations up to date");
   } catch (err) {
      console.error("[conduit] Migration failed:", err);
      process.exit(1);
   }

   // ── 3. Redis ───────────────────────────────────────────────────────────────
   const redisUrl =
      process.env.REDIS_URL ??
      `redis://${config.redis.host}:${config.redis.port}`;

   try {
      initRedis(redisUrl);
      console.log("[conduit] Redis connected");
   } catch (err) {
      console.error("[conduit] Redis connection failed:", err);
      process.exit(1);
   }

   // ── 4. License ─────────────────────────────────────────────────────────────
   const hasLicense = !!(
      process.env.LICENSE_MANIFEST_URL && process.env.LICENSE_PUBLIC_KEY
   );

   if (hasLicense) {
      try {
         const state = await checkLicense();
         if (state.status === "update_required") {
            console.warn(
               `[conduit] ⚠ Version lock: installed=${state.installedVersion}, ` +
                  `minimum=${state.minimumVersion}. ` +
                  `Version-locked endpoints will return HTTP 426 until updated.`
            );
         } else {
            console.log(`[conduit] License OK (v${state.installedVersion})`);
         }
      } catch (err) {
         // Non-fatal — gateway runs with last known license state from Postgres
         console.warn(
            "[conduit] Initial license check failed (non-fatal):",
            err
         );
      }

      // ── 5. License loop ──────────────────────────────────────────────────────
      startLicenseCheckLoop();
   } else {
      console.log(
         "[conduit] License system not configured — running unrestricted"
      );
   }

   // ── 6. Config watcher (dev only) ──────────────────────────────────────────
   watchConfig(); // No-op in production (guarded inside watchConfig)

   // ── 7. HTTP + WebSocket server ─────────────────────────────────────────────
   const app = createApp();
   const port = parseInt(process.env.PORT ?? String(config.gateway.port), 10);
   const host = process.env.HOST ?? config.gateway.host;

   const server = Bun.serve({
      port,
      hostname: host,

      // HTTP fetch handler — Hono handles all HTTP requests
      fetch(req, server) {
         // WebSocket upgrade
         if (
            req.headers.get("Upgrade")?.toLowerCase() === "websocket" &&
            new URL(req.url).pathname === "/ws"
         ) {
            const upgraded = server.upgrade(req);
            if (!upgraded) {
               return new Response("WebSocket upgrade failed", { status: 400 });
            }
            return undefined;
         }

         return app.fetch(req, { server });
      },

      // WebSocket lifecycle
      websocket: socketHandlers
   });

   console.log(
      `[conduit] Gateway ready → http://${host}:${port} (ws://${host}:${port}/ws)`
   );

   // ── Graceful shutdown ──────────────────────────────────────────────────────
   const shutdown = async (signal: string): Promise<void> => {
      console.log(`\n[conduit] ${signal} received — shutting down…`);

      // Stop new connections
      server.stop(true);

      // Stop background loops
      stopLicenseCheckLoop();
      unwatchConfig();

      // Drain DB connections
      await Promise.allSettled([closePostgres(), closeRedis()]);

      console.log("[conduit] Shutdown complete");
      process.exit(0);
   };

   process.on("SIGTERM", () => shutdown("SIGTERM"));
   process.on("SIGINT", () => shutdown("SIGINT"));
}

// ── Boot ───────────────────────────────────────────────────────────────────────

start().catch(err => {
   console.error("[conduit] Fatal startup error:", err);
   process.exit(1);
});

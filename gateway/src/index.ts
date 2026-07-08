/**
 * Conduit Gateway — Entry Point
 *
 * Startup sequence (order is load-bearing):
 *   1. loadEnv()         — populate process.env from .env before anything reads it
 *   2. loadConfig()      — parse and validate conduit.config.toml
 *   3. initPostgres()    — connect pool
 *   4. runMigrations()   — apply pending SQL migrations
 *   5. primeKeyCache()   — load all provider keys from Postgres into memory
 *   6. initRedis()       — connect Redis
 *   7. checkLicense()    — initial manifest fetch (if configured)
 *   8. startLicenseCheckLoop() — schedule periodic re-checks
 *   9. watchConfig()     — file watcher in dev (no-op in production)
 *  10. Bun.serve()       — start HTTP + WebSocket server
 *
 * Graceful shutdown (SIGTERM / SIGINT):
 *   - Stop accepting new connections (server.stop)
 *   - Stop license check loop
 *   - Stop config file watcher
 *   - Drain Postgres pool
 *   - Disconnect Redis
 */

import { loadEnv } from "./config/config.env";
import { loadConfig, watchConfig, unwatchConfig } from "./config/config.loader";
import { initPostgres, closePostgres } from "./db/postgres/postgres.client";
import { runMigrations } from "./db/postgres/postgres.migrate";
import {
   initSQLite,
   closeSQLite,
   runSQLiteMigrations
} from "./db/sqlite/sqlite.client";
import { primeKeyCache } from "./db/stores/key.store";
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

   // ── 1. Environment ─────────────────────────────────────────────────────────
   // Must run before loadConfig() and initPostgres() — both read process.env.
   loadEnv();

   // ── 2. Config ──────────────────────────────────────────────────────────────
   let config: ReturnType<typeof loadConfig>;
   try {
      config = loadConfig();
      console.log(
         `[conduit] Config loaded — app: ${config.app.name}, port: ${config.app.port}`
      );
   } catch (err) {
      console.error("[conduit] Failed to load conduit.config.toml:", err);
      process.exit(1);
   }

   // ── 3. Database ────────────────────────────────────────────────────────────
   const useSQLite = config.data.sqlite_fallback;

   if (useSQLite) {
      // SQLite fallback — for single-instance deployments without Postgres
      console.log(
         "[conduit] Using SQLite fallback (config.data.sqlite_fallback = true)"
      );
      try {
         initSQLite();
         console.log("[conduit] SQLite opened");
      } catch (err) {
         console.error("[conduit] SQLite init failed:", err);
         process.exit(1);
      }

      // ── 4a. SQLite migrations ───────────────────────────────────────────────
      try {
         await runSQLiteMigrations();
      } catch (err) {
         console.error("[conduit] SQLite migration failed:", err);
         process.exit(1);
      }
   } else {
      // Postgres — default for production and multi-instance deployments
      const pgUrl =
         process.env.DATABASE_URL ??
         process.env.POSTGRES_URL ??
         (() => {
            const host = process.env.PGHOST ?? "localhost";
            const port = process.env.PGPORT ?? "5432";
            const user = process.env.PGUSER ?? "conduit";
            const pass = process.env.PGPASSWORD ?? "";
            const db = process.env.PGDATABASE ?? "conduit";
            return `postgresql://${user}:${pass}@${host}:${port}/${db}`;
         })();

      try {
         initPostgres(pgUrl);
         console.log("[conduit] Postgres connected");
      } catch (err) {
         console.error("[conduit] Postgres connection failed:", err);
         process.exit(1);
      }

      // ── 4b. Postgres migrations ─────────────────────────────────────────────
      try {
         await runMigrations();
      } catch (err) {
         console.error("[conduit] Migration failed:", err);
         process.exit(1);
      }
   }

   // ── 5. Key cache ───────────────────────────────────────────────────────────
   // Must run before any request is served — provider adapters call getKey()
   // synchronously on every streaming request.
   try {
      await primeKeyCache();
      console.log("[conduit] Key cache primed");
   } catch (err) {
      console.error("[conduit] Failed to prime key cache:", err);
      process.exit(1);
   }

   // ── 6. Redis ───────────────────────────────────────────────────────────────
   const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

   try {
      initRedis(redisUrl);
      console.log("[conduit] Redis connected");
   } catch (err) {
      console.error("[conduit] Redis connection failed:", err);
      process.exit(1);
   }

   // ── 7. License ─────────────────────────────────────────────────────────────
   const hasLicense = !!(
      process.env.LICENSE_MANIFEST_URL && process.env.LICENSE_PUBLIC_KEY
   );

   if (hasLicense) {
      try {
         const state = await checkLicense();
         if (state.status === "update_required") {
            console.warn(
               `[conduit] ⚠ Version lock active — installed: ${state.installedVersion}, ` +
                  `required >= ${state.minimumVersion}. ` +
                  `Version-locked endpoints return HTTP 426 until updated.`
            );
         } else {
            console.log(`[conduit] License OK (v${state.installedVersion})`);
         }
      } catch (err) {
         // Non-fatal — gateway runs with last known state from Postgres
         console.warn(
            "[conduit] Initial license check failed (non-fatal):",
            err
         );
      }

      // ── 8. License check loop ─────────────────────────────────────────────
      startLicenseCheckLoop();
   } else {
      console.log(
         "[conduit] License system not configured — running unrestricted"
      );
   }

   // ── 9. Config watcher (dev only, no-op in production) ─────────────────────
   watchConfig();

   // ── 10. HTTP + WebSocket server ────────────────────────────────────────────
   const app = createApp();
   const port = parseInt(process.env.PORT ?? String(config.app.port), 10);
   // config.app has no host field — default to 0.0.0.0 to bind all interfaces,
   // overridable via HOST env var for single-interface deployments.
   const host = process.env.HOST ?? "0.0.0.0";

   const server = Bun.serve({
      port,
      hostname: host,

      fetch(req, server) {
         // WebSocket upgrade — only on /ws path
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

      websocket: socketHandlers
   });

   console.log(
      `[conduit] Gateway ready → http://${host}:${port}  ws://${host}:${port}/ws`
   );

   // ── Graceful shutdown ──────────────────────────────────────────────────────
   const shutdown = async (signal: string): Promise<void> => {
      console.log(`\n[conduit] ${signal} received — shutting down…`);

      server.stop(true); // stop accepting new connections

      stopLicenseCheckLoop();
      unwatchConfig();

      await Promise.allSettled([
         useSQLite ? closeSQLite() : closePostgres(),
         closeRedis()
      ]);

      console.log("[conduit] Shutdown complete");
      process.exit(0);
   };

   process.on("SIGTERM", () => {
      void shutdown("SIGTERM");
   });
   process.on("SIGINT", () => {
      void shutdown("SIGINT");
   });
}

// ── Boot ───────────────────────────────────────────────────────────────────────

start().catch(err => {
   console.error("[conduit] Fatal startup error:", err);
   process.exit(1);
});

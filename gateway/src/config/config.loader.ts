import { parse } from "smol-toml";
import { readFileSync, existsSync, watchFile, unwatchFile } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { AppConfigSchema, type AppConfig } from "./config.schema";

// ── Path resolution ───────────────────────────────────────────────────────────

const CONFIG_FILENAME = "conduit.config.toml";
const MAX_WALK_DEPTH = 8;

/**
 * Resolves the config file path by walking up the directory tree from the
 * current working directory. This supports running the gateway from any
 * sub-directory of the monorepo (e.g. `cd gateway && bun run dev`).
 */
function resolveConfigPath(): string {
   const candidates: string[] = [];

   // 1. Explicit env override
   if (process.env.CONDUIT_CONFIG_PATH) {
      const explicit = resolve(process.env.CONDUIT_CONFIG_PATH);
      if (existsSync(explicit)) return explicit;
      candidates.push(explicit);
   }

   // 2. Walk up from cwd
   let dir = process.cwd();
   for (let i = 0; i < MAX_WALK_DEPTH; i++) {
      const candidate = resolve(dir, CONFIG_FILENAME);
      candidates.push(candidate);
      if (existsSync(candidate)) return candidate;
      const parent = dirname(dir);
      if (parent === dir) break; // reached filesystem root
      dir = parent;
   }

   throw new Error(
      `[conduit] Could not find ${CONFIG_FILENAME}.\n` +
         `Searched:\n${candidates.map(c => `  ${c}`).join("\n")}\n\n` +
         `Run the gateway from within the Conduit workspace, or set ` +
         `CONDUIT_CONFIG_PATH to point directly at your config file.`
   );
}

// ── Cache ─────────────────────────────────────────────────────────────────────

interface CacheEntry {
   config: AppConfig;
   path: string;
   mtime: number;
}

let _cache: CacheEntry | null = null;
let _watchActive = false;

// ── Parsing ───────────────────────────────────────────────────────────────────

function parse_and_validate(path: string): AppConfig {
   let raw: string;

   try {
      raw = readFileSync(path, "utf-8");
   } catch (err) {
      throw new Error(
         `[conduit] Failed to read ${path}: ${err instanceof Error ? err.message : String(err)}`
      );
   }

   let toml: unknown;
   try {
      toml = parse(raw);
   } catch (err) {
      throw new Error(
         `[conduit] Syntax error in ${path}:\n  ${err instanceof Error ? err.message : String(err)}`
      );
   }

   const result = AppConfigSchema.safeParse(toml);

   if (!result.success) {
      const issues = result.error.issues
         .map(issue => `  [${issue.path.join(".")}] ${issue.message}`)
         .join("\n");

      throw new Error(
         `[conduit] Invalid configuration in ${path}:\n${issues}\n\n` +
            `See docs/gateway/config.md for the full schema reference.`
      );
   }

   return result.data;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns the parsed, validated application config. Cached after the first
 * successful load — subsequent calls are synchronous reads from memory.
 *
 * Pass `forceReload = true` to bypass the cache (used in tests and when the
 * file watcher detects a change).
 */
export function loadConfig(forceReload = false): AppConfig {
   if (_cache && !forceReload) return _cache.config;

   const path = resolveConfigPath();
   const config = parse_and_validate(path);

   const stat = Bun.file(path);
   const mtime = stat.lastModified ?? Date.now();

   _cache = { config, path, mtime };
   return config;
}

/**
 * Returns the absolute path to the resolved config file.
 * Primarily used for startup logging.
 */
export function getConfigPath(): string {
   return _cache?.path ?? resolveConfigPath();
}

/**
 * Watches the config file for changes and reloads automatically.
 * Logs a warning if the new config is invalid — keeps the last known good
 * config in place rather than crashing on a mid-edit reload.
 *
 * Call this once at startup in development. In production Docker builds,
 * config changes require a container restart so this is a no-op there.
 */
export function watchConfig(): void {
   if (_watchActive || process.env.NODE_ENV === "production") return;

   const path = getConfigPath();
   _watchActive = true;

   watchFile(path, { interval: 1_000 }, () => {
      try {
         const config = parse_and_validate(path);
         const previous = _cache?.config;
         _cache = { config, path, mtime: Date.now() };

         if (previous) {
            console.log("[conduit] conduit.config.toml reloaded");
         }
      } catch (err) {
         console.warn(
            "[conduit] Config reload failed — keeping last known good config.\n",
            err instanceof Error ? err.message : err
         );
      }
   });
}

/**
 * Stops the config file watcher. Called on graceful shutdown.
 */
export function unwatchConfig(): void {
   if (!_watchActive || !_cache) return;
   unwatchFile(_cache.path);
   _watchActive = false;
}

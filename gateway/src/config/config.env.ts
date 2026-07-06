import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProviderEnvStatus {
   readonly id: string;
   readonly envKey: string;
   readonly configured: boolean;
}

export interface EnvStatus {
   readonly providers: ProviderEnvStatus[];
   readonly postgresConfigured: boolean;
   readonly redisConfigured: boolean;
   readonly ollamaUrl: string;
   readonly jwtSecretSet: boolean;
   readonly selfUrlSet: boolean;
   readonly nodeEnv: "development" | "production" | "test";
}

// ── Provider registry ─────────────────────────────────────────────────────────

/**
 * Every provider that Conduit knows about, mapped to its env key.
 * Used for startup health reporting and key-store cache priming.
 * Add new providers here — the rest of the system picks them up automatically.
 */
export const PROVIDER_ENV_MAP = {
   anthropic: "ANTHROPIC_API_KEY",
   openai: "OPENAI_API_KEY",
   google: "GOOGLE_API_KEY",
   groq: "GROQ_API_KEY",
   stability: "STABILITY_API_KEY",
   serpapi: "SERPAPI_API_KEY",
   brave: "BRAVE_SEARCH_API_KEY"
} as const satisfies Record<string, string>;

export type ProviderId = keyof typeof PROVIDER_ENV_MAP;

// ── .env loading ──────────────────────────────────────────────────────────────

const MAX_WALK_DEPTH = 8;

function findEnvPath(): string | null {
   let dir = process.cwd();
   for (let i = 0; i < MAX_WALK_DEPTH; i++) {
      const candidate = resolve(dir, ".env");
      if (existsSync(candidate)) return candidate;
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
   }
   return null;
}

/**
 * Loads `.env` into `process.env` without any external dependencies.
 * Handles quoted values, inline comments, and multiline values
 * (triple-quoted, for PEM keys like the license public key).
 *
 * Existing env vars are never overridden — Docker/Kubernetes-injected
 * values always take precedence over the .env file.
 *
 * This is safe to call multiple times — subsequent calls are no-ops unless
 * `force = true` is passed.
 */
let _envLoaded = false;

export function loadEnv(force = false): void {
   if (_envLoaded && !force) return;

   const path = findEnvPath();
   if (!path) {
      _envLoaded = true;
      return;
   }

   const raw = readFileSync(path, "utf-8");
   const lines = raw.split("\n");
   let i = 0;

   while (i < lines.length) {
      const line = lines[i].trim();
      i++;

      // Skip blank lines and comments
      if (!line || line.startsWith("#")) continue;

      const eqIdx = line.indexOf("=");
      if (eqIdx === -1) continue;

      const key = line.slice(0, eqIdx).trim();
      let value = line.slice(eqIdx + 1).trim();

      // Handle triple-quoted multiline values (used for PEM keys)
      if (value.startsWith('"""')) {
         const parts: string[] = [value.slice(3)];
         while (i < lines.length) {
            const next = lines[i];
            i++;
            if (next.trimEnd().endsWith('"""')) {
               parts.push(next.trimEnd().slice(0, -3));
               break;
            }
            parts.push(next);
         }
         value = parts.join("\n").trim();
      } else {
         // Strip inline comments (# after value)
         value = value.replace(/\s+#.*$/, "");
         // Strip surrounding quotes
         if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
         ) {
            value = value.slice(1, -1);
         }
      }

      if (key && value && !(key in process.env)) {
         process.env[key] = value;
      }
   }

   _envLoaded = true;
}

// ── Status ────────────────────────────────────────────────────────────────────

/**
 * Returns a snapshot of the current environment's configuration status.
 * Used for startup logging and the /api/status endpoint.
 *
 * Does not expose raw values — only booleans and safe strings.
 */
export function getEnvStatus(): EnvStatus {
   const nodeEnv = (process.env.NODE_ENV ??
      "development") as EnvStatus["nodeEnv"];

   return {
      providers: Object.entries(PROVIDER_ENV_MAP).map(([id, envKey]) => ({
         id,
         envKey,
         configured:
            typeof process.env[envKey] === "string" &&
            process.env[envKey]!.length > 4
      })),
      postgresConfigured:
         typeof process.env.POSTGRES_URL === "string" &&
         process.env.POSTGRES_URL.length > 0,
      redisConfigured:
         typeof process.env.REDIS_URL === "string" &&
         process.env.REDIS_URL.length > 0,
      ollamaUrl: process.env.OLLAMA_URL ?? "http://localhost:11434",
      jwtSecretSet:
         typeof process.env.JWT_SECRET === "string" &&
         process.env.JWT_SECRET.length >= 32 &&
         process.env.JWT_SECRET !== "change_this_before_deploying",
      selfUrlSet:
         typeof process.env.SELF_URL === "string" &&
         process.env.SELF_URL.length > 0,
      nodeEnv: ["development", "production", "test"].includes(nodeEnv)
         ? nodeEnv
         : "development"
   };
}

/**
 * Returns true if at least one AI provider key is available — either via env
 * var or (after boot) via the database key store. This is the signal that the
 * gateway can do something useful; without it, all model endpoints return a
 * 412 with a clear setup instruction.
 */
export function hasAnyProviderConfigured(): boolean {
   return Object.values(PROVIDER_ENV_MAP).some(
      key =>
         typeof process.env[key] === "string" && process.env[key]!.length > 4
   );
}

/**
 * Returns the raw env value for a provider, if set.
 * Prefer the key-store's `getKey()` over this in provider adapters — the
 * key store checks the database first, then falls back to this.
 */
export function getProviderEnvKey(providerId: ProviderId): string | undefined {
   const envKey = PROVIDER_ENV_MAP[providerId];
   const value = process.env[envKey];
   return typeof value === "string" && value.length > 0 ? value : undefined;
}

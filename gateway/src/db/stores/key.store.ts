import { query } from "@db/postgres/postgres.client";
import { invalidateHealthScore } from "@db/redis/redis.usage";
import {
   getProviderEnvKey,
   type ProviderId,
   PROVIDER_ENV_MAP
} from "@config/config.env";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProviderCategory = "chat" | "image" | "search" | "code";

export interface StoredKey {
   id: string;
   provider: string;
   category: ProviderCategory;
   label: string;
   createdAt: Date;
   updatedAt: Date;
}

// ── In-memory cache ───────────────────────────────────────────────────────────

/**
 * Hot-path cache: provider ID → raw key value. Provider adapters call
 * `getKey()` on every streaming request — a Postgres round-trip here would
 * add meaningful latency. The cache is primed at startup and kept in sync
 * on every write/delete.
 *
 * This is intentionally a simple Map rather than a TTL cache: keys change
 * rarely (user action only), so staleness is not a concern. The cache is
 * always invalidated immediately on write.
 */
const _keyCache = new Map<string, string>();

/**
 * Temporary overrides used during key introspection/probing. A probe must
 * test the candidate key, not whatever is currently saved for that provider.
 * These are set immediately before a probe and cleared in a finally block.
 */
const _tempOverrides = new Map<string, string>();

// ── Cache management ──────────────────────────────────────────────────────────

/**
 * Loads all saved keys from Postgres into the in-memory cache.
 * Must be called once at startup before serving any requests.
 */
export async function primeKeyCache(): Promise<void> {
   const { rows } = await query<{ provider: string; key_value: string }>(
      "SELECT provider, key_value FROM keys"
   );
   _keyCache.clear();
   for (const row of rows) {
      _keyCache.set(row.provider, row.key_value);
   }
}

export function setTemporaryKey(provider: string, key: string): void {
   _tempOverrides.set(provider, key);
}

export function clearTemporaryKey(provider: string): void {
   _tempOverrides.delete(provider);
}

// ── Key resolution ────────────────────────────────────────────────────────────

/**
 * Resolves the active key for a provider. Resolution order:
 * 1. Temporary override (set during introspection probing)
 * 2. Database cache (set via UI)
 * 3. Environment variable (fallback for .env workflow)
 *
 * Returns undefined if no key is configured for the given provider.
 */
export function getKey(provider: string): string | undefined {
   return (
      _tempOverrides.get(provider) ??
      _keyCache.get(provider) ??
      (provider in PROVIDER_ENV_MAP
         ? getProviderEnvKey(provider as ProviderId)
         : process.env[`${provider.toUpperCase()}_API_KEY`]) ??
      undefined
   );
}

/**
 * Returns a masked hint of the active key for display purposes.
 * Never returns the raw key.
 */
export function getKeyHint(provider: string): string {
   const key = getKey(provider);
   if (!key) return "";
   if (key.length <= 8) return "***";
   return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function listKeys(): Promise<StoredKey[]> {
   const { rows } = await query<{
      id: string;
      provider: string;
      category: ProviderCategory;
      label: string;
      created_at: Date;
      updated_at: Date;
   }>(
      "SELECT id, provider, category, label, created_at, updated_at FROM keys ORDER BY created_at"
   );

   return rows.map(r => ({
      id: r.id,
      provider: r.provider,
      category: r.category,
      label: r.label,
      createdAt: r.created_at,
      updatedAt: r.updated_at
   }));
}

export async function saveKey(
   provider: string,
   keyValue: string,
   category: ProviderCategory,
   label?: string
): Promise<StoredKey> {
   const { rows } = await query<{
      id: string;
      provider: string;
      category: ProviderCategory;
      label: string;
      created_at: Date;
      updated_at: Date;
   }>(
      `INSERT INTO keys (provider, category, label, key_value)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (provider) DO UPDATE
       SET category  = EXCLUDED.category,
           label     = EXCLUDED.label,
           key_value = EXCLUDED.key_value,
           updated_at = now()
     RETURNING id, provider, category, label, created_at, updated_at`,
      [provider, category, label ?? provider, keyValue]
   );

   const row = rows[0]!;
   _keyCache.set(provider, keyValue);
   await invalidateHealthScore(provider);

   return {
      id: row.id,
      provider: row.provider,
      category: row.category,
      label: row.label,
      createdAt: row.created_at,
      updatedAt: row.updated_at
   };
}

export async function deleteKey(provider: string): Promise<void> {
   await query("DELETE FROM keys WHERE provider = $1", [provider]);
   _keyCache.delete(provider);
   await invalidateHealthScore(provider);
}

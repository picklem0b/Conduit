import { checkPostgresHealth } from "@db/postgres/postgres.client";
import { checkRedisHealth } from "@db/redis/redis.client";
import { getAllChatProviderHealth } from "@providers/chat/chat.registry";
import { getAllImageProviderHealth } from "@providers/image/media.registry";
import { getAllSearchProviderHealth } from "@providers/search/search.registry";
import { loadConfig } from "@config/config.loader";
import type { ProviderHealth } from "@providers/provider.types";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ServiceStatus = "operational" | "degraded" | "down";
export type OverallStatus = "operational" | "degraded" | "outage";

export interface ServiceEntry {
   name: string;
   status: ServiceStatus;
   latencyMs: number | null;
   checkedAt: number;
   error?: string;
}

export interface MirrorEntry {
   label: string;
   url: string;
   status: ServiceStatus;
   latencyMs: number | null;
   checkedAt: number;
}

/**
 * Public status response — safe for unauthenticated access.
 * No provider names tied to keys, no request logs, no user data.
 */
export interface PublicStatus {
   overall: OverallStatus;
   checkedAt: number;
   services: ServiceEntry[];
   mirrors: MirrorEntry[];
}

/**
 * Internal status response — includes provider health detail.
 * Only returned to authenticated dashboard requests.
 */
export interface InternalStatus extends PublicStatus {
   providers: ProviderHealth[];
   postgres: Awaited<ReturnType<typeof checkPostgresHealth>>;
   redis: Awaited<ReturnType<typeof checkRedisHealth>>;
}

// ── Mirror ping ───────────────────────────────────────────────────────────────

async function pingMirror(label: string, url: string): Promise<MirrorEntry> {
   const started = Date.now();
   const checkedAt = started;

   try {
      const response = await fetch(url, {
         signal: AbortSignal.timeout(6_000),
         // Use HEAD when possible to avoid downloading a full page body
         method: "HEAD"
      });

      const latencyMs = Date.now() - started;
      const status: ServiceStatus = response.ok ? "operational" : "degraded";

      return { label, url, status, latencyMs, checkedAt };
   } catch (err) {
      return {
         label,
         url,
         status: "down",
         latencyMs: null,
         checkedAt
      };
   }
}

// ── Internal service checks ───────────────────────────────────────────────────

async function checkGateway(): Promise<ServiceEntry> {
   // The gateway itself is always reachable if this code is running
   return {
      name: "gateway",
      status: "operational",
      latencyMs: 0,
      checkedAt: Date.now()
   };
}

async function checkPostgres(): Promise<ServiceEntry> {
   const health = await checkPostgresHealth();
   return {
      name: "postgres",
      status: health.healthy ? "operational" : "down",
      latencyMs: health.latencyMs,
      checkedAt: Date.now(),
      error: health.error
   };
}

async function checkRedis(): Promise<ServiceEntry> {
   const health = await checkRedisHealth();
   return {
      name: "redis",
      status: health.healthy ? "operational" : "down",
      latencyMs: health.latencyMs,
      checkedAt: Date.now(),
      error: health.error
   };
}

// ── Overall status derivation ─────────────────────────────────────────────────

function deriveOverall(
   services: ServiceEntry[],
   mirrors: MirrorEntry[]
): OverallStatus {
   const allEntries = [
      ...services.map(s => s.status),
      ...mirrors.map(m => m.status)
   ];

   if (allEntries.every(s => s === "operational")) return "operational";

   // Core services being down = outage; mirrors/providers degraded = degraded
   const coreServices = services.filter(s =>
      ["gateway", "postgres", "redis"].includes(s.name)
   );
   if (coreServices.some(s => s.status === "down")) return "outage";

   return "degraded";
}

// ── Public aggregator ─────────────────────────────────────────────────────────

/**
 * Builds the public status snapshot. All checks run concurrently.
 * Safe to call on unauthenticated requests — returns no sensitive data.
 */
export async function getPublicStatus(): Promise<PublicStatus> {
   const config = loadConfig();
   const checkedAt = Date.now();

   const [gatewayEntry, postgresEntry, redisEntry, mirrorResults] =
      await Promise.all([
         checkGateway(),
         checkPostgres(),
         checkRedis(),
         Promise.all(
            config.status_page.mirrors.map(m => pingMirror(m.label, m.url))
         )
      ]);

   const services: ServiceEntry[] = [gatewayEntry, postgresEntry, redisEntry];

   // Append any additional named services from config that aren't auto-checked
   // (e.g. 'engine' — reported as unknown until the engine registers itself)
   for (const name of config.status_page.services) {
      if (!services.find(s => s.name === name)) {
         services.push({
            name,
            status: "degraded",
            latencyMs: null,
            checkedAt
         });
      }
   }

   return {
      overall: deriveOverall(services, mirrorResults),
      checkedAt,
      services,
      mirrors: mirrorResults
   };
}

/**
 * Builds the full internal status snapshot including provider health.
 * Used by the gateway dashboard — never expose publicly.
 */
export async function getInternalStatus(): Promise<InternalStatus> {
   const [
      publicStatus,
      chatProviders,
      imageProviders,
      searchProviders,
      postgres,
      redis
   ] = await Promise.all([
      getPublicStatus(),
      getAllChatProviderHealth(),
      getAllImageProviderHealth(),
      getAllSearchProviderHealth(),
      checkPostgresHealth(),
      checkRedisHealth()
   ]);

   return {
      ...publicStatus,
      providers: [...chatProviders, ...imageProviders, ...searchProviders],
      postgres,
      redis
   };
}

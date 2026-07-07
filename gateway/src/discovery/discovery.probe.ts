import { allChatAdapters } from "@providers/chat/chat.registry";
import { allImageAdapters } from "@providers/image/media.registry";
import { allSearchAdapters } from "@providers/search/search.registry";
import { setTemporaryKey, clearTemporaryKey } from "@db/stores/key.store";
import {
   describeCapabilities,
   summarizeCapabilities
} from "./discovery.capabilities";
import type {
   ProviderCategory,
   ModelCapability
} from "@providers/provider.types";
import type { BaseProvider } from "@providers/provider.base";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DiscoveryMatch {
   provider: string;
   name: string;
   category: ProviderCategory;
   status:
      | "active"
      | "invalid_key"
      | "rate_limited"
      | "unreachable"
      | "unconfigured";
   latencyMs: number;
   modelsAvailable: number;
   capabilities: ReturnType<typeof describeCapabilities>;
   capabilitySummary: string;
   error?: string;
}

export interface DiscoveryResult {
   key: string; // masked — never the raw key
   matches: DiscoveryMatch[];
   totalProbed: number;
   duration: number;
   summary: string;
}

// ── Probe ─────────────────────────────────────────────────────────────────────

/**
 * Probes a raw API key against every known adapter across all provider
 * categories simultaneously. Returns a full picture of what the key can do
 * without requiring the user to know which provider it belongs to.
 *
 * Key isolation: each probe uses a temporary in-memory override that is
 * always cleared in a finally block — a probe can never leak a candidate
 * key into another request's key resolution path, even if the probe throws.
 *
 * Parallelism: all adapters are probed concurrently with Promise.allSettled
 * so a single slow or hanging provider doesn't block the others. Each probe
 * has its own 10-second timeout enforced inside BaseProvider.timeoutSignal().
 *
 * Only 'active' matches are returned — invalid/unreachable probes are
 * collected for the totalProbed count but not surfaced to the user unless
 * zero matches are found (in which case the error from the closest match
 * is included in the summary to help debug).
 */
export async function probeKey(rawKey: string): Promise<DiscoveryResult> {
   const started = Date.now();
   const maskedKey = maskKey(rawKey);

   const allAdapters: { adapter: BaseProvider; category: ProviderCategory }[] =
      [
         ...allChatAdapters().map(a => ({
            adapter: a,
            category: "chat" as const
         })),
         ...allImageAdapters().map(a => ({
            adapter: a,
            category: "image" as const
         })),
         ...allSearchAdapters().map(a => ({
            adapter: a,
            category: "search" as const
         }))
      ];

   // Skip Ollama — it's local and doesn't use an API key
   const keyedAdapters = allAdapters.filter(e => e.adapter.id !== "ollama");

   const results = await Promise.allSettled(
      keyedAdapters.map(({ adapter, category }) =>
         probeOneAdapter(rawKey, adapter, category)
      )
   );

   const all: DiscoveryMatch[] = results
      .map(r => (r.status === "fulfilled" ? r.value : null))
      .filter((r): r is DiscoveryMatch => r !== null);

   const matches = all.filter(r => r.status === "active");
   const duration = Date.now() - started;

   return {
      key: maskedKey,
      matches,
      totalProbed: keyedAdapters.length,
      duration,
      summary: buildSummary(matches, all)
   };
}

// ── Single adapter probe ──────────────────────────────────────────────────────

async function probeOneAdapter(
   rawKey: string,
   adapter: BaseProvider,
   category: ProviderCategory
): Promise<DiscoveryMatch> {
   // Set the temporary key so the adapter uses the candidate key for this probe
   setTemporaryKey(adapter.id, rawKey);

   try {
      const probeResult = await adapter.probe();
      const models = adapter.listModels();
      const capabilities: ModelCapability[] = Array.from(
         new Set(models.flatMap(m => m.capabilities))
      );

      // For image/search providers, add the category-specific capability
      // if the adapter doesn't explicitly list it in model capabilities
      if (category === "image" && !capabilities.includes("streaming")) {
         capabilities.push("image_generation" as ModelCapability);
      }
      if (category === "search") {
         capabilities.push("web_search" as ModelCapability);
      }

      const described = describeCapabilities(capabilities);

      return {
         provider: adapter.id,
         name: adapter.name,
         category,
         status: probeResult.status,
         latencyMs: probeResult.latencyMs,
         modelsAvailable: probeResult.modelsAvailable,
         capabilities: described,
         capabilitySummary: summarizeCapabilities(capabilities),
         error: probeResult.error
      };
   } finally {
      // Always clear — even if probe() threw
      clearTemporaryKey(adapter.id);
   }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function maskKey(key: string): string {
   if (key.length <= 8) return "***";
   return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

function buildSummary(
   matches: DiscoveryMatch[],
   all: DiscoveryMatch[]
): string {
   if (matches.length === 0) {
      const rateLimited = all.find(r => r.status === "rate_limited");
      if (rateLimited) {
         return `This key was recognized by ${rateLimited.name} but is currently rate-limited. Try again in a moment.`;
      }

      const invalid = all.find(r => r.status === "invalid_key");
      if (invalid) {
         return `This key was recognized as a ${invalid.name} key but was rejected — it may be expired, revoked, or miscopied.`;
      }

      return `This key didn't match any provider Conduit knows about. Double-check that it's a supported provider key.`;
   }

   const providerNames = matches.map(m => m.name);
   const names =
      providerNames.length === 1
         ? providerNames[0]!
         : providerNames.slice(0, -1).join(", ") +
           " and " +
           providerNames.at(-1)!;

   const capSummaries = Array.from(
      new Set(matches.flatMap(m => m.capabilities.map(c => c.label)))
   );

   const caps =
      capSummaries.length <= 3
         ? capSummaries.join(", ")
         : capSummaries.slice(0, 3).join(", ") +
           ` and ${capSummaries.length - 3} more`;

   return `This key works with ${names}. Capabilities: ${caps}.`;
}

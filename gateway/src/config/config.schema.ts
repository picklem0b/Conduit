import { z } from "zod";
import { getVersion } from "./utils/config.version";

// ── Cascade ───────────────────────────────────────────────────────────────────

export const CascadeProfileSchema = z.object({
   /**
    * Ordered list of model IDs. The cascade engine re-ranks this list at
    * runtime by live provider health scores — this order is the tiebreaker
    * when health scores are equal.
    */
   chain: z
      .array(z.string())
      .min(1, "Cascade chain must have at least one model"),

   /**
    * Fraction of the model's context window that triggers a cascade.
    * 0.82 means cascade when 82% of the context is filled.
    */
   token_threshold: z.number().min(0).max(1).default(0.85),

   /**
    * Switch to a cheaper model when accumulated cost exceeds this value (USD).
    * Set to 0 to disable cost-based cascading.
    */
   cost_cap_usd: z.number().min(0).default(0),

   /**
    * Whether to summarize the conversation before handing off to the next
    * model, so it isn't starting completely blind.
    */
   compress_on_handoff: z.boolean().default(false),

   /**
    * Model ID used to generate the handoff summary. Should be a cheap, fast
    * model — e.g. groq/llama3-8b-8192. Falls back to naive truncation if
    * this model is unconfigured.
    */
   compressor: z.string().optional(),

   /**
    * After cascading down to a cheaper model, attempt to return to the
    * original model once it recovers (rate limit window passes, etc).
    */
   reverse_cascade: z.boolean().default(false),

   /**
    * Number of times to retry the same model on error before cascading.
    * 0 means cascade immediately on the first error.
    */
   retry_on_error: z.number().int().min(0).default(0)
});

// ── Site routing ──────────────────────────────────────────────────────────────

export const SiteProfileSchema = z.object({
   /**
    * Maps to a UI variant served by a specific interface.
    * Valid values: 'chat' | 'media' | 'tester' | 'default'
    */
   variant: z.enum(["chat", "media", "tester", "default"]).default("default"),
   label: z.string().optional()
});

// ── Status page ───────────────────────────────────────────────────────────────

export const StatusMirrorSchema = z.object({
   label: z.string(),
   url: z.string().url("Mirror URL must be a valid URL")
});

// ── License ───────────────────────────────────────────────────────────────────

export const LicenseConfigSchema = z
   .object({
      manifest_url: z.preprocess(
         v => (v === "" || v === null ? undefined : v),
         z.string().url().optional()
      ),
      public_key: z.preprocess(
         v => (typeof v === "string" && v.trim() === "" ? undefined : v),
         z.string().min(1).optional()
      ),
      check_interval_hours: z.number().int().min(1).max(168).default(6)
   })
   .default({ check_interval_hours: 6 });

// ── Root schema ───────────────────────────────────────────────────────────────

export const AppConfigSchema = z.object({
   app: z.object({
      name: z.string().min(1).default("Conduit"),
      port: z.number().int().min(1).max(65535).default(4000),
      mode: z.enum(["auto", "mobile", "desktop"]).default("auto"),
      /**
       * Resolved at runtime — do not set in conduit.config.toml.
       * Resolution: CONDUIT_VERSION env → git tag → package.json → '0.0.0-dev'
       */
      version: z.string().default(getVersion())
   }),

   cascade: z.object({
      profiles: z
         .record(z.string(), CascadeProfileSchema)
         .refine(
            p => Object.keys(p).length > 0,
            "At least one cascade profile is required"
         )
   }),

   data: z.object({
      uploads_dir: z.string().min(1).default("./data/uploads"),
      /**
       * When true, the gateway uses SQLite instead of Postgres.
       * Only supported for single-instance deployments. Disabled by default.
       */
      sqlite_fallback: z.boolean().default(false)
   }),

   features: z.object({
      cascade: z.boolean().default(true),
      parallel: z.boolean().default(false),
      log_explorer: z.boolean().default(false),
      split_view: z.boolean().default(false),
      voice: z.boolean().default(false)
   }),

   sites: z.record(z.string(), SiteProfileSchema).default({}),

   status_page: z
      .object({
         mirrors: z.array(StatusMirrorSchema).default([]),
         services: z.array(z.string()).default([])
      })
      .default({ mirrors: [], services: [] }),

   license: LicenseConfigSchema
});

// ── Exported types ────────────────────────────────────────────────────────────

export type AppConfig = z.infer<typeof AppConfigSchema>;
export type CascadeProfile = z.infer<typeof CascadeProfileSchema>;
export type SiteProfile = z.infer<typeof SiteProfileSchema>;
export type StatusMirror = z.infer<typeof StatusMirrorSchema>;
export type LicenseConfig = z.infer<typeof LicenseConfigSchema>;

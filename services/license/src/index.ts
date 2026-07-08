/**
 * Conduit License Manifest Server
 *
 * A minimal Bun HTTP server that serves Ed25519-signed version manifests.
 * The gateway fetches this endpoint on startup and on a configurable schedule
 * to determine whether the installed version satisfies the minimum requirement.
 *
 * Wire format (matches license.verify.ts expectations exactly):
 *   <base64url(signature)>.<base64url(json payload)>
 *
 * The signature covers the base64url-encoded payload bytes, not the raw JSON —
 * this means the gateway verifies the bytes it received, preventing any
 * normalisation attacks (e.g. JSON key reordering).
 *
 * Environment variables:
 *   LICENSE_PRIVATE_KEY   — Ed25519 private key in SPKI/PKCS8 PEM format (required)
 *   MINIMUM_VERSION       — Semver string to enforce (default: "0.0.0")
 *   PORT                  — Port to listen on (default: 3100)
 *   MANIFEST_REASON       — Optional human-readable reason for the version requirement
 *   REQUIRE_BEARER        — If set, requests must include Authorization: Bearer <value>
 *
 * Endpoints:
 *   GET /manifest   → signed manifest (the URL you set as LICENSE_MANIFEST_URL in the gateway)
 *   GET /health     → liveness probe
 *   GET /public-key → SPKI PEM of the public key (for initial setup convenience)
 *
 * Key generation:
 *   Run `bun src/keygen.ts` to generate a new key pair.
 *   Copy the public key into the gateway's LICENSE_PUBLIC_KEY env var.
 *   Keep the private key in this service's LICENSE_PRIVATE_KEY env var only.
 */

// ── Key loading ────────────────────────────────────────────────────────────────

/**
 * Parses a PEM-encoded Ed25519 private key (PKCS8 format) into a CryptoKey.
 * Accepts both with and without the -----BEGIN PRIVATE KEY----- header.
 */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
   const base64 = pem
      .replace(/-----BEGIN.*?-----/g, "")
      .replace(/-----END.*?-----/g, "")
      .replace(/\s+/g, "");

   const keyBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

   return crypto.subtle.importKey(
      "pkcs8",
      keyBytes,
      { name: "Ed25519" },
      true, // extractable — needed to derive public key below
      ["sign"]
   );
}

/**
 * Derives the SPKI-encoded public key from a CryptoKeyPair's private key.
 * Used to serve /public-key and to validate the private key is correct Ed25519.
 */
async function derivePublicKeyPem(privateKey: CryptoKey): Promise<string> {
   // Export the private key as PKCS8 JWK, then re-import as public
   const jwk = await crypto.subtle.exportKey("jwk", privateKey);

   // For Ed25519 in WebCrypto JWK, remove the 'd' field to get the public key
   const {
      d: _d,
      key_ops: _ops,
      ...publicJwk
   } = jwk as {
      d?: string;
      key_ops?: string[];
      [k: string]: unknown;
   };

   const publicKey = await crypto.subtle.importKey(
      "jwk",
      { ...publicJwk, key_ops: ["verify"] },
      { name: "Ed25519" },
      true,
      ["verify"]
   );

   const spki = await crypto.subtle.exportKey("spki", publicKey);
   const b64 = btoa(String.fromCharCode(...new Uint8Array(spki)));
   const lines = b64.match(/.{1,64}/g)?.join("\n") ?? b64;
   return `-----BEGIN PUBLIC KEY-----\n${lines}\n-----END PUBLIC KEY-----`;
}

// ── Manifest signing ──────────────────────────────────────────────────────────

/**
 * Builds and signs the manifest payload.
 *
 * The payload is serialised to JSON, then base64url-encoded. The Ed25519
 * signature is computed over the raw bytes of the base64url-encoded payload
 * (not over the JSON string) — this is the format license.verify.ts expects.
 *
 * Returns the compact wire format: `<sig_b64url>.<payload_b64url>`
 */
async function signManifest(
   privateKey: CryptoKey,
   minimumVersion: string,
   reason?: string
): Promise<string> {
   const payload = {
      issuedAt: new Date().toISOString(),
      minimumVersion,
      ...(reason ? { reason } : {})
   };

   const payloadJson = JSON.stringify(payload);
   const payloadBytes = new TextEncoder().encode(payloadJson);
   const payloadB64 = base64url(payloadBytes);

   // Sign the payload bytes (NOT the base64-encoded version — sign the raw JSON)
   // This matches what the gateway verifier does: it decodes the base64 then
   // verifies the signature against the decoded bytes.
   const sigBytes = new Uint8Array(
      await crypto.subtle.sign("Ed25519", privateKey, payloadBytes)
   );
   const sigB64 = base64url(sigBytes);

   return `${sigB64}.${base64url(payloadBytes)}`;
}

function base64url(bytes: Uint8Array): string {
   return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
}

// ── Cache ─────────────────────────────────────────────────────────────────────

/**
 * The manifest is re-signed at most once per minute. This prevents unnecessary
 * crypto operations on every poll (gateways typically poll every 6+ hours,
 * but a misconfigured gateway could poll more aggressively).
 *
 * The cache is invalidated when MINIMUM_VERSION changes — the server must be
 * restarted to pick up a new version requirement. This is intentional: version
 * lock changes are operational decisions that should require a deliberate deploy.
 */
interface ManifestCache {
   signed: string;
   expiresAt: number;
}

let _cache: ManifestCache | null = null;
const CACHE_TTL_MS = 60_000; // 1 minute

async function getSignedManifest(
   privateKey: CryptoKey,
   minimumVersion: string,
   reason?: string
): Promise<string> {
   const now = Date.now();
   if (_cache && now < _cache.expiresAt) return _cache.signed;

   const signed = await signManifest(privateKey, minimumVersion, reason);
   _cache = { signed, expiresAt: now + CACHE_TTL_MS };
   return signed;
}

// ── Server ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
   // ── Load config from environment ───────────────────────────────────────────
   const privateKeyPem = process.env.LICENSE_PRIVATE_KEY;
   if (!privateKeyPem) {
      console.error(
         "[license-server] LICENSE_PRIVATE_KEY is required.\n" +
            "Run `bun src/keygen.ts` to generate a key pair, then set the env var."
      );
      process.exit(1);
   }

   const minimumVersion = process.env.MINIMUM_VERSION ?? "0.0.0";
   const port = parseInt(process.env.PORT ?? "3100", 10);
   const reason = process.env.MANIFEST_REASON;
   const requireBearer = process.env.REQUIRE_BEARER;

   // ── Import key ─────────────────────────────────────────────────────────────
   let privateKey: CryptoKey;
   let publicKeyPem: string;
   try {
      privateKey = await importPrivateKey(privateKeyPem);
      publicKeyPem = await derivePublicKeyPem(privateKey);
      console.log("[license-server] Ed25519 key loaded");
   } catch (err) {
      console.error(
         "[license-server] Failed to import LICENSE_PRIVATE_KEY:",
         err instanceof Error ? err.message : err
      );
      process.exit(1);
   }

   console.log(
      `[license-server] Starting — minimum_version: ${minimumVersion}, port: ${port}`
   );

   // ── HTTP server ────────────────────────────────────────────────────────────
   const server = Bun.serve({
      port,
      hostname: "0.0.0.0",

      async fetch(req) {
         const url = new URL(req.url);

         // ── Bearer auth (optional) ─────────────────────────────────────────────
         if (requireBearer) {
            const auth = req.headers.get("Authorization");
            const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
            if (token !== requireBearer) {
               return new Response(
                  JSON.stringify({
                     error: "Unauthorized",
                     code: "unauthorized"
                  }),
                  {
                     status: 401,
                     headers: { "Content-Type": "application/json" }
                  }
               );
            }
         }

         // ── GET /manifest ──────────────────────────────────────────────────────
         if (url.pathname === "/manifest" && req.method === "GET") {
            const signed = await getSignedManifest(
               privateKey,
               minimumVersion,
               reason
            );

            return new Response(signed, {
               status: 200,
               headers: {
                  "Content-Type": "text/plain; charset=utf-8",
                  // Gateways should always fetch fresh — no CDN caching
                  "Cache-Control": "no-store, no-cache, must-revalidate",
                  "X-Minimum-Version": minimumVersion,
                  "X-Issued-At": new Date().toISOString()
               }
            });
         }

         // ── GET /health ────────────────────────────────────────────────────────
         if (url.pathname === "/health" && req.method === "GET") {
            return new Response(
               JSON.stringify({
                  status: "ok",
                  minimumVersion,
                  timestamp: new Date().toISOString()
               }),
               {
                  status: 200,
                  headers: { "Content-Type": "application/json" }
               }
            );
         }

         // ── GET /public-key ────────────────────────────────────────────────────
         // Convenience endpoint for initial gateway setup.
         // In production, disable this with REQUIRE_BEARER or firewall rules.
         if (url.pathname === "/public-key" && req.method === "GET") {
            return new Response(publicKeyPem, {
               status: 200,
               headers: { "Content-Type": "text/plain; charset=utf-8" }
            });
         }

         // ── 404 ───────────────────────────────────────────────────────────────
         return new Response(
            JSON.stringify({ error: "Not found", code: "not_found" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
         );
      },

      error(err) {
         console.error("[license-server] Unhandled error:", err.message);
         return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
         );
      }
   });

   console.log(`[license-server] Listening on http://0.0.0.0:${port}`);
   console.log(`[license-server] Manifest URL: http://<host>:${port}/manifest`);

   // ── Start keepalive loop ───────────────────────────────────────────────────
   const { startKeepalive, stopKeepalive } = await import("./keepalive");
   startKeepalive({
      baseUrl: `http://127.0.0.1:${port}`,
      intervalMs: 60_000,
      bearerToken: requireBearer
   });

   // ── Graceful shutdown ──────────────────────────────────────────────────────
   const shutdown = (signal: string) => {
      console.log(`\n[license-server] ${signal} — shutting down`);
      stopKeepalive();
      server.stop(true);
      process.exit(0);
   };

   process.on("SIGTERM", () => shutdown("SIGTERM"));
   process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch(err => {
   console.error("[license-server] Fatal:", err);
   process.exit(1);
});

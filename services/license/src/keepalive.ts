/**
 * Conduit License Server — Self-Keepalive / Uptime Monitor
 *
 * This module pings the manifest endpoint on a fixed interval and logs the
 * result. Two purposes:
 *
 * 1. Early detection of signing failures — if the server is running but
 *    signing is broken (e.g. key corruption after a restart), the keepalive
 *    catches it before the first gateway poll.
 *
 * 2. Container orchestration health signal — the keepalive writes a
 *    `.keepalive` file to /tmp on success. A Docker HEALTHCHECK can read
 *    this file's mtime rather than making an HTTP call, which avoids
 *    adding a curl/wget dependency to the minimal container image.
 *
 * Usage: imported by index.ts after the server starts.
 * Not a standalone process — no separate Bun.serve() here.
 *
 * The keepalive is intentionally dumb: it verifies the manifest endpoint
 * returns 200 and the response body matches the expected wire format
 * (<sig>.<payload>). It does NOT verify the signature — that would require
 * the public key in this process, creating a circular dependency.
 */

import { writeFileSync } from "node:fs";

const KEEPALIVE_FILE = "/tmp/.conduit_license_keepalive";
const WIRE_FORMAT_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

export interface KeepaliveOptions {
   /** Base URL of the license server (e.g. "http://localhost:3100") */
   baseUrl: string;
   /** Interval between pings in ms. Default: 60_000 (1 minute) */
   intervalMs?: number;
   /** Bearer token if REQUIRE_BEARER is set */
   bearerToken?: string;
}

export interface KeepaliveResult {
   ok: boolean;
   latencyMs: number;
   error?: string;
   timestamp: string;
}

let _timer: ReturnType<typeof setInterval> | null = null;
let _lastResult: KeepaliveResult | null = null;

/**
 * Returns the result of the most recent keepalive ping, or null if no
 * ping has completed yet.
 */
export function getLastKeepaliveResult(): KeepaliveResult | null {
   return _lastResult;
}

/**
 * Performs a single keepalive ping against the manifest endpoint.
 * Called on schedule by startKeepalive() and can also be called directly
 * in tests or for an immediate health check.
 */
export async function ping(opts: KeepaliveOptions): Promise<KeepaliveResult> {
   const url = `${opts.baseUrl}/manifest`;
   const started = Date.now();
   const timestamp = new Date().toISOString();

   try {
      const headers: Record<string, string> = {};
      if (opts.bearerToken) {
         headers["Authorization"] = `Bearer ${opts.bearerToken}`;
      }

      const response = await fetch(url, {
         method: "GET",
         headers,
         signal: AbortSignal.timeout(10_000)
      });

      if (!response.ok) {
         const result: KeepaliveResult = {
            ok: false,
            latencyMs: Date.now() - started,
            error: `HTTP ${response.status}`,
            timestamp
         };
         _lastResult = result;
         return result;
      }

      const body = (await response.text()).trim();

      if (!WIRE_FORMAT_RE.test(body)) {
         const result: KeepaliveResult = {
            ok: false,
            latencyMs: Date.now() - started,
            error: "Response body does not match expected wire format (<sig>.<payload>)",
            timestamp
         };
         _lastResult = result;
         return result;
      }

      // Validate the payload is valid base64 + parseable JSON
      const payloadB64 = body.split(".")[1]!;
      // base64url → standard base64
      const standard = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
      const padded = standard + "===".slice((standard.length + 3) % 4);
      const payloadJson = atob(padded);
      const payload = JSON.parse(payloadJson) as Record<string, unknown>;

      if (
         typeof payload["minimumVersion"] !== "string" ||
         typeof payload["issuedAt"] !== "string"
      ) {
         const result: KeepaliveResult = {
            ok: false,
            latencyMs: Date.now() - started,
            error: "Manifest payload missing required fields (minimumVersion, issuedAt)",
            timestamp
         };
         _lastResult = result;
         return result;
      }

      // Write the keepalive file for container HEALTHCHECK
      try {
         writeFileSync(KEEPALIVE_FILE, timestamp);
      } catch {
         // Non-fatal — /tmp may not be writable in some environments
      }

      const result: KeepaliveResult = {
         ok: true,
         latencyMs: Date.now() - started,
         timestamp
      };
      _lastResult = result;
      return result;
   } catch (err) {
      const result: KeepaliveResult = {
         ok: false,
         latencyMs: Date.now() - started,
         error: err instanceof Error ? err.message : String(err),
         timestamp
      };
      _lastResult = result;
      return result;
   }
}

/**
 * Starts the keepalive loop. Runs an initial ping immediately, then on the
 * given interval. Uses setInterval rather than recursive setTimeout because
 * the ping itself is fast (local loopback) and we want a predictable schedule.
 */
export function startKeepalive(opts: KeepaliveOptions): void {
   const intervalMs = opts.intervalMs ?? 60_000;

   // Initial ping — don't wait for the first interval
   void ping(opts).then(result => {
      if (result.ok) {
         console.log(`[license-server:keepalive] OK (${result.latencyMs}ms)`);
      } else {
         console.warn(`[license-server:keepalive] FAILED: ${result.error}`);
      }
   });

   _timer = setInterval(() => {
      void ping(opts).then(result => {
         if (result.ok) {
            console.log(
               `[license-server:keepalive] OK (${result.latencyMs}ms)`
            );
         } else {
            console.warn(
               `[license-server:keepalive] FAILED: ${result.error ?? "unknown error"}`
            );
         }
      });
   }, intervalMs);
}

/**
 * Stops the keepalive loop. Called on graceful shutdown.
 */
export function stopKeepalive(): void {
   if (_timer !== null) {
      clearInterval(_timer);
      _timer = null;
   }
}

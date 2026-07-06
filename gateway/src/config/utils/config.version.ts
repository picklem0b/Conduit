import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

interface PackageJson {
   version?: string;
   [key: string]: unknown;
}

/**
 * Resolves the application version from the environment, falling back through
 * progressively less reliable sources. Resolution order:
 *
 * 1. CONDUIT_VERSION environment variable — set explicitly in CI/CD or Docker
 * 2. Latest annotated git tag — accurate in development when running from source
 * 3. package.json version field — fallback when git is unavailable
 * 4. '0.0.0-dev' — last resort, signals an unconfigured environment
 *
 * The resolved version is memoized after the first call so git is only
 * executed once per process lifetime.
 */
let _cached: string | null = null;

export function getVersion(): string {
   if (_cached !== null) return _cached;

   const fromEnv = process.env.CONDUIT_VERSION?.trim();
   if (fromEnv) {
      _cached = fromEnv;
      return _cached;
   }

   try {
      const tag = execSync("git describe --tags --abbrev=0", {
         encoding: "utf8",
         stdio: ["ignore", "pipe", "ignore"],
         timeout: 3_000
      }).trim();

      if (tag) {
         _cached = tag;
         return _cached;
      }
   } catch {
      // git not available or no tags — fall through
   }

   try {
      const pkgPath = join(process.cwd(), "package.json");
      if (existsSync(pkgPath)) {
         const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as PackageJson;
         if (typeof pkg.version === "string" && pkg.version.length > 0) {
            _cached = pkg.version;
            return _cached;
         }
      }
   } catch {
      // Malformed package.json — fall through
   }

   _cached = "0.0.0-dev";
   return _cached;
}

export interface VersionInfo {
   readonly version: string;
   readonly isDevelopment: boolean;
   readonly isPreRelease: boolean;
   readonly isRelease: boolean;
   readonly major: number;
   readonly minor: number;
   readonly patch: number;
}

function parseSemver(
   version: string
): Pick<VersionInfo, "major" | "minor" | "patch"> {
   // Strip leading 'v' if present (e.g. git tags like 'v1.2.3')
   const clean = version.replace(/^v/, "").split("-")[0];
   const [major = 0, minor = 0, patch = 0] = clean.split(".").map(Number);
   return { major, minor, patch };
}

export function getVersionInfo(): VersionInfo {
   const version = getVersion();
   const { major, minor, patch } = parseSemver(version);
   return {
      version,
      isDevelopment: version.includes("dev"),
      isPreRelease: version.includes("-") && !version.includes("dev"),
      isRelease: !version.includes("-") && !version.includes("dev"),
      major,
      minor,
      patch
   };
}

/**
 * Returns true if `a` is strictly older than `b`.
 * Used by the license/version-lock system.
 */
export function isOlderThan(a: string, b: string): boolean {
   const av = parseSemver(a);
   const bv = parseSemver(b);
   if (av.major !== bv.major) return av.major < bv.major;
   if (av.minor !== bv.minor) return av.minor < bv.minor;
   return av.patch < bv.patch;
}

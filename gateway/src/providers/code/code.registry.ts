import { getKey } from "@db/stores/key.store";
import type {
   CodeRuntime,
   ExecutionOptions,
   ExecutionResult
} from "./code.types";
import { RUNTIME_TEMPLATES, isSupportedRuntime } from "./code.types";

// ── E2B client (lazy import) ──────────────────────────────────────────────────

/**
 * E2B SDK is loaded lazily so the gateway starts without it when no E2B key
 * is configured. This avoids a hard startup failure for users who don't use
 * code execution.
 */
async function getE2BClient() {
   try {
      return await import("@e2b/code-interpreter");
   } catch {
      throw new Error(
         "E2B SDK not installed. Run: npm install @e2b/code-interpreter"
      );
   }
}

// ── Registry ──────────────────────────────────────────────────────────────────

/**
 * Returns true when an E2B API key is configured.
 */
export function isCodeExecutionConfigured(): boolean {
   return !!getKey("e2b");
}

/**
 * Executes `code` in an isolated E2B sandbox for the given runtime.
 *
 * Each call creates a fresh sandbox, runs the code, and tears the sandbox
 * down immediately after — no state persists between calls. This is
 * intentional: Conduit's code execution is for single-shot evaluation,
 * not persistent REPL sessions.
 *
 * The sandbox is killed if it exceeds `timeoutMs` (default 15s, max 30s).
 *
 * @throws when E2B is not configured or the SDK is not installed.
 */
export async function executeCode(
   code: string,
   runtime: CodeRuntime,
   options: ExecutionOptions = {}
): Promise<ExecutionResult> {
   if (!isCodeExecutionConfigured()) {
      throw new Error(
         "Code execution requires an E2B API key. Add one via Settings → Providers → e2b."
      );
   }

   const { Sandbox } = await getE2BClient();
   const timeoutMs = Math.min(options.timeoutMs ?? 15_000, 30_000);
   const template = RUNTIME_TEMPLATES[runtime];

   const started = Date.now();
   const sandbox = await Sandbox.create(template, {
      apiKey: getKey("e2b") as string,
      timeoutMs
   });

   try {
      if (options.env) {
         for (const [k, v] of Object.entries(options.env)) {
            await sandbox.process.startAndWait(
               `export ${k}="${v.replace(/"/g, '\\"')}"`
            );
         }
      }

      // Determine the run command for each runtime
      const runCmd = buildRunCommand(runtime, code);
      const proc = await sandbox.process.startAndWait(runCmd, {
         timeoutMs
      });

      return {
         stdout: proc.stdout ?? "",
         stderr: proc.stderr ?? "",
         exitCode: proc.exitCode ?? 0,
         durationMs: Date.now() - started,
         runtime
      };
   } finally {
      await sandbox.kill().catch(() => {});
   }
}

// ── Command builder ───────────────────────────────────────────────────────────

function buildRunCommand(runtime: CodeRuntime, code: string): string {
   // Write code to a temp file then execute — avoids shell escaping headaches
   const escaped = code.replace(/'/g, `'\\''`);

   switch (runtime) {
      case "python":
         return `python3 -c '${escaped}'`;

      case "typescript":
         return [
            `echo '${escaped}' > /tmp/_conduit_exec.ts`,
            `npx ts-node --skip-project /tmp/_conduit_exec.ts`
         ].join(" && ");

      case "javascript":
         return `node -e '${escaped}'`;

      case "bash":
         return `bash -c '${escaped}'`;
   }
}

// ── Runtime list ──────────────────────────────────────────────────────────────

export { isSupportedRuntime, SUPPORTED_RUNTIMES };

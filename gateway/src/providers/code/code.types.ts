// ── Code execution types ──────────────────────────────────────────────────────

/**
 * Supported execution runtimes. Each maps to an E2B sandbox template.
 * Templates are pre-built Docker images with the language runtime installed.
 */
export type CodeRuntime = "python" | "typescript" | "javascript" | "bash";

/** E2B sandbox template IDs for each runtime */
export const RUNTIME_TEMPLATES: Record<CodeRuntime, string> = {
   python: "python3",
   typescript: "typescript",
   javascript: "nodejs",
   bash: "base"
};

export const SUPPORTED_RUNTIMES = Object.keys(
   RUNTIME_TEMPLATES
) as CodeRuntime[];

export function isSupportedRuntime(r: string): r is CodeRuntime {
   return SUPPORTED_RUNTIMES.includes(r as CodeRuntime);
}

// ── Execution result ──────────────────────────────────────────────────────────

export interface ExecutionResult {
   /** stdout from the process */
   stdout: string;
   /** stderr from the process */
   stderr: string;
   /** Process exit code — 0 means success */
   exitCode: number;
   /** Wall-clock duration of the sandbox execution in ms */
   durationMs: number;
   /** Runtime that was used */
   runtime: CodeRuntime;
}

// ── Execution options ─────────────────────────────────────────────────────────

export interface ExecutionOptions {
   /** Timeout in ms. Max 30 000ms. Defaults to 15 000ms. */
   timeoutMs?: number;
   /** Environment variables to inject into the sandbox */
   env?: Record<string, string>;
}

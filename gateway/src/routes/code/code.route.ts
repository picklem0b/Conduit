import { Hono } from "hono";
import { handleCodeExecute, handleCodeRuntimes } from "./code.execute";

/**
 * Code execution routes — version-locked.
 *
 * POST /api/code/execute   → run code in an E2B sandbox
 * GET  /api/code/runtimes  → list supported runtimes + configured status
 */
const codeRoute = new Hono();

codeRoute.post("/execute", handleCodeExecute);
codeRoute.get("/runtimes", handleCodeRuntimes);

export { codeRoute };

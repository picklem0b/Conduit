import { loadEnv } from "@config/config.env";
import { initPostgres, closePostgres } from "@db/postgres/postgres.client";
import { runMigrations } from "@db/postgres/postgres.migrate";

loadEnv(true);

console.log("POSTGRES_URL =", process.env.POSTGRES_URL);
console.log(process.env.POSTGRES_URL);
const url = process.env.POSTGRES_URL;

if (!url) {
   console.error(
      "[migrate] POSTGRES_URL is not set. Add it to .env or set it in your environment."
   );
   process.exit(1);
}

console.log("[migrate] connecting...");
initPostgres(url);

try {
   await runMigrations();
} catch (err) {
   console.error("[migrate] failed:", err instanceof Error ? err.message : err);
   process.exit(1);
} finally {
   await closePostgres();
}

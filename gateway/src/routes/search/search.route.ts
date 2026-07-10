import { Hono } from "hono";
import { handleSearch, handleSearchProviders } from "./search.query";

/**
 * Search routes — version-locked.
 *
 * POST /api/search            → execute a web search
 * GET  /api/search/providers  → list configured search providers
 */
const searchRoute = new Hono();

searchRoute.post("/", handleSearch);
searchRoute.post("/query", handleSearch)
searchRoute.get("/providers", handleSearchProviders);

export { searchRoute };

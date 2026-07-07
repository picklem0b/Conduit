import { Hono } from "hono";
import { handleGenerateImage, handleImageModels } from "./media.generate";

/**
 * Media (image generation) routes — all version-locked.
 *
 * POST /api/media/generate  → generate images from a prompt
 * GET  /api/media/models    → list available image models
 */
const mediaRoute = new Hono();

mediaRoute.post("/generate", handleGenerateImage);
mediaRoute.get("/models", handleImageModels);

export { mediaRoute };

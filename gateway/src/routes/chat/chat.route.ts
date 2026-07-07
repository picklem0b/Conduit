import { Hono } from "hono";
import { handleChatStream } from "./chat.stream";
import {
   handleListConversations,
   handleGetConversation,
   handlePatchConversation,
   handleDeleteConversation,
   handleTruncateFrom
} from "./chat.history";

/**
 * Chat routes — all version-locked via middleware.version.ts.
 *
 * Streaming:
 *   POST   /api/chat/stream                                    → SSE stream
 *
 * Conversation management:
 *   GET    /api/chat/conversations                             → list (summaries)
 *   GET    /api/chat/conversations/:id                        → detail + messages
 *   PATCH  /api/chat/conversations/:id                        → rename
 *   DELETE /api/chat/conversations/:id                        → delete
 *   DELETE /api/chat/conversations/:id/messages/:messageId    → truncate from
 */
const chatRoute = new Hono();

chatRoute.post("/stream", handleChatStream);

chatRoute.get("/conversations", handleListConversations);
chatRoute.get("/conversations/:id", handleGetConversation);
chatRoute.patch("/conversations/:id", handlePatchConversation);
chatRoute.delete("/conversations/:id", handleDeleteConversation);
chatRoute.delete("/conversations/:id/messages/:messageId", handleTruncateFrom);

export { chatRoute };

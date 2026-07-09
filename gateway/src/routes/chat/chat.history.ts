import { z } from "zod";
import type { Context } from "hono";
import {
    listConversations,
    getConversation,
    setConversationTitle,
    deleteConversation,
    type InterfaceType
} from "@db/stores/conversation.store";
import {
    getMessages,
    truncateFrom
} from "@db/stores/message.store";

// ── GET /api/chat/conversations ───────────────────────────────────────────────

/**
 * Lists conversations, optionally filtered by interface type.
 * Returns summaries only (id, title, interface, updatedAt) — no message
 * content — so the sidebar can render without loading full history.
 */
export async function handleListConversations(c: Context): Promise<Response> {
    const ifaceParam = c.req.query("interface");
    const limitParam = c.req.query("limit");
    const limit = limitParam
        ? Math.min(parseInt(limitParam, 10) || 50, 200)
        : 50;

    const validInterfaces: InterfaceType[] = ["chat", "media", "tester"];
    const iface =
        ifaceParam && validInterfaces.includes(ifaceParam as InterfaceType)
            ? (ifaceParam as InterfaceType)
            : undefined;

    const conversations = await listConversations(iface, limit);
    return c.json({ conversations });
}

// ── GET /api/chat/conversations/:id ──────────────────────────────────────────

/**
 * Returns a single conversation and its full message history.
 * The messages array is ordered ascending by creation time.
 */
export async function handleGetConversation(c: Context): Promise<Response> {
    const id = c.req.param("id");
    if (!id)
        return c.json(
            { error: "Missing conversation ID", code: "bad_request" },
            400
        );

    const conversation = await getConversation(id);
    if (!conversation) {
        return c.json(
            { error: "Conversation not found", code: "not_found" },
            404
        );
    }

    const messages = await getMessages(id);
    return c.json({ conversation, messages });
}

// ── PATCH /api/chat/conversations/:id ────────────────────────────────────────

const PatchConversationSchema = z.object({
    title: z.string().min(1).max(120)
});

/**
 * Updates a conversation's title. The only mutable field exposed via the API
 * is title — other fields (contextSummary, interface) are managed internally.
 */
export async function handlePatchConversation(c: Context): Promise<Response> {
    const id = c.req.param("id");
    if (!id)
        return c.json(
            { error: "Missing conversation ID", code: "bad_request" },
            400
        );

    const conversation = await getConversation(id);
    if (!conversation) {
        return c.json(
            { error: "Conversation not found", code: "not_found" },
            404
        );
    }

    let body: z.infer<typeof PatchConversationSchema>;
    try {
        const raw = await c.req.json();
        body = PatchConversationSchema.parse(raw);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return c.json(
                {
                    error: "Validation failed",
                    code: "validation_error",
                    detail: err.issues
                },
                422
            );
        }
        return c.json({ error: "Invalid JSON body", code: "bad_request" }, 400);
    }

    await setConversationTitle(id, body.title);
    return c.json({ id, title: body.title });
}

// ── DELETE /api/chat/conversations/:id ───────────────────────────────────────

/**
 * Permanently deletes a conversation and all its messages (FK cascade).
 */
export async function handleDeleteConversation(c: Context): Promise<Response> {
    const id = c.req.param("id");
    if (!id)
        return c.json(
            { error: "Missing conversation ID", code: "bad_request" },
            400
        );

    await deleteConversation(id);
    return c.body(null, 204);
}

// ── DELETE /api/chat/conversations/:id/messages/:messageId ───────────────────

/**
 * Truncates a conversation from a specific message onward (inclusive).
 * Used by the "Edit & Regenerate" flow — deletes the selected message
 * and everything after it so a fresh response can be generated from that point.
 */
export async function handleTruncateFrom(c: Context): Promise<Response> {
    const conversationId = c.req.param("id");
    const messageId = c.req.param("messageId");

    if (!conversationId || !messageId) {
        return c.json(
            {
                error: "Missing conversation or message ID",
                code: "bad_request"
            },
            400
        );
    }

    const conversation = await getConversation(conversationId);
    if (!conversation) {
        return c.json(
            { error: "Conversation not found", code: "not_found" },
            404
        );
    }

    await truncateFrom(conversationId, messageId);
    return c.body(null, 204);
}

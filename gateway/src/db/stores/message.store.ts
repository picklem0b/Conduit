import { query, transaction } from "@db/postgres/postgres.client";
import type { MessageRole } from "./conversation.store";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Message {
   id: string;
   conversationId: string;
   role: MessageRole;
   content: string;
   model: string | null;
   provider: string | null;
   tokenCount: number | null;
   costUsd: number | null;
   createdAt: Date;
}

export interface AppendMessageInput {
   conversationId: string;
   role: MessageRole;
   content: string;
   model?: string;
   provider?: string;
   tokenCount?: number;
   costUsd?: number;
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getMessages(conversationId: string): Promise<Message[]> {
   const { rows } = await query<{
      id: string;
      conversation_id: string;
      role: MessageRole;
      content: string;
      model: string | null;
      provider: string | null;
      token_count: number | null;
      cost_usd: string | null;
      created_at: Date;
   }>(
      `SELECT id, conversation_id, role, content, model, provider, token_count, cost_usd, created_at
     FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC`,
      [conversationId]
   );

   return rows.map(r => ({
      id: r.id,
      conversationId: r.conversation_id,
      role: r.role,
      content: r.content,
      model: r.model,
      provider: r.provider,
      tokenCount: r.token_count,
      costUsd: r.cost_usd !== null ? parseFloat(r.cost_usd) : null,
      createdAt: r.created_at
   }));
}

// ── Write ─────────────────────────────────────────────────────────────────────

export async function appendMessage(
   input: AppendMessageInput
): Promise<Message> {
   const { rows } = await query<{
      id: string;
      conversation_id: string;
      role: MessageRole;
      content: string;
      model: string | null;
      provider: string | null;
      token_count: number | null;
      cost_usd: string | null;
      created_at: Date;
   }>(
      `INSERT INTO messages (conversation_id, role, content, model, provider, token_count, cost_usd)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, conversation_id, role, content, model, provider, token_count, cost_usd, created_at`,
      [
         input.conversationId,
         input.role,
         input.content,
         input.model ?? null,
         input.provider ?? null,
         input.tokenCount ?? null,
         input.costUsd ?? null
      ]
   );

   // Touch the conversation's updated_at so the list stays sorted correctly
   await query("UPDATE conversations SET updated_at = now() WHERE id = $1", [
      input.conversationId
   ]);

   const r = rows[0]!;
   return {
      id: r.id,
      conversationId: r.conversation_id,
      role: r.role,
      content: r.content,
      model: r.model,
      provider: r.provider,
      tokenCount: r.token_count,
      costUsd: r.cost_usd !== null ? parseFloat(r.cost_usd) : null,
      createdAt: r.created_at
   };
}

/**
 * Deletes a message and all messages that came after it in the conversation.
 * Used for edit and regenerate — discards the tail of the conversation from
 * the given message ID onward so fresh messages can be appended cleanly.
 */
export async function truncateFrom(
   conversationId: string,
   messageId: string
): Promise<void> {
   await transaction(async client => {
      const { rows } = await client.query<{ created_at: Date }>(
         "SELECT created_at FROM messages WHERE id = $1 AND conversation_id = $2",
         [messageId, conversationId]
      );

      if (rows.length === 0) return;

      const cutoff = rows[0]!.created_at;

      await client.query(
         "DELETE FROM messages WHERE conversation_id = $1 AND created_at >= $2",
         [conversationId, cutoff]
      );

      await client.query(
         "UPDATE conversations SET updated_at = now() WHERE id = $1",
         [conversationId]
      );
   });
}

export async function deleteMessage(messageId: string): Promise<void> {
   await query("DELETE FROM messages WHERE id = $1", [messageId]);
}

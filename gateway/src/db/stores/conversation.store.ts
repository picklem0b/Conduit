import { query, transaction } from "@db/postgres/postgres.client";

// ── Types ─────────────────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant" | "system" | "tool";
export type InterfaceType = "chat" | "media" | "tester";

export interface Conversation {
   id: string;
   title: string;
   contextSummary: string | null;
   interface: InterfaceType;
   createdAt: Date;
   updatedAt: Date;
}

export interface ConversationSummary {
   id: string;
   title: string;
   interface: InterfaceType;
   updatedAt: Date;
}

// ── Conversations ─────────────────────────────────────────────────────────────

export async function ensureConversation(
   id: string,
   title = "New Chat",
   iface: InterfaceType = "chat"
): Promise<Conversation> {
   const { rows } = await query<{
      id: string;
      title: string;
      context_summary: string | null;
      interface: InterfaceType;
      created_at: Date;
      updated_at: Date;
   }>(
      `INSERT INTO conversations (id, title, interface)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET updated_at = now()
     RETURNING id, title, context_summary, interface, created_at, updated_at`,
      [id, title, iface]
   );

   const r = rows[0]!;
   return {
      id: r.id,
      title: r.title,
      contextSummary: r.context_summary,
      interface: r.interface,
      createdAt: r.created_at,
      updatedAt: r.updated_at
   };
}

export async function getConversation(
   id: string
): Promise<Conversation | null> {
   const { rows } = await query<{
      id: string;
      title: string;
      context_summary: string | null;
      interface: InterfaceType;
      created_at: Date;
      updated_at: Date;
   }>(
      "SELECT id, title, context_summary, interface, created_at, updated_at FROM conversations WHERE id = $1",
      [id]
   );

   if (rows.length === 0) return null;
   const r = rows[0]!;
   return {
      id: r.id,
      title: r.title,
      contextSummary: r.context_summary,
      interface: r.interface,
      createdAt: r.created_at,
      updatedAt: r.updated_at
   };
}

export async function listConversations(
   iface?: InterfaceType,
   limit = 50
): Promise<ConversationSummary[]> {
   const { rows } = await query<{
      id: string;
      title: string;
      interface: InterfaceType;
      updated_at: Date;
   }>(
      `SELECT id, title, interface, updated_at FROM conversations
     ${iface ? "WHERE interface = $1" : ""}
     ORDER BY updated_at DESC
     LIMIT ${iface ? "$2" : "$1"}`,
      iface ? [iface, limit] : [limit]
   );

   return rows.map(r => ({
      id: r.id,
      title: r.title,
      interface: r.interface,
      updatedAt: r.updated_at
   }));
}

export async function setConversationTitle(
   id: string,
   title: string
): Promise<void> {
   await query(
      "UPDATE conversations SET title = $1, updated_at = now() WHERE id = $2",
      [title.slice(0, 120), id]
   );
}

export async function setContextSummary(
   id: string,
   summary: string
): Promise<void> {
   await query(
      "UPDATE conversations SET context_summary = $1, updated_at = now() WHERE id = $2",
      [summary, id]
   );
}

export async function deleteConversation(id: string): Promise<void> {
   // Messages are cascade-deleted by the FK constraint in 003.conversations.sql
   await query("DELETE FROM conversations WHERE id = $1", [id]);
}

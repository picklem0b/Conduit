import type { WireEvent } from "@streaming/stream.types";

// ── Client → Gateway messages ─────────────────────────────────────────────────

/**
 * A client sends one of these message types over the WebSocket connection.
 * All messages are JSON-serialized objects with a `type` discriminant.
 */
export type ClientMessage =
   | ClientChatMessage
   | ClientPingMessage
   | ClientCancelMessage;

/**
 * Initiates a streaming chat request over WebSocket. Functionally identical
 * to POST /api/chat/stream but multiplexed over a single persistent connection.
 *
 * The `requestId` field is chosen by the client and echoed back on every
 * gateway response event so the client can correlate events with requests
 * when multiple streams are in-flight on the same connection.
 */
export interface ClientChatMessage {
   type: "chat";
   requestId: string;
   messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
   model: string;
   cascadeEnabled?: boolean;
   cascadeProfile?: string;
   conversationId?: string;
   systemPrompt?: string;
   maxTokens?: number;
   temperature?: number;
}

/** Keep-alive ping — gateway responds with a `pong` event */
export interface ClientPingMessage {
   type: "ping";
}

/**
 * Asks the gateway to abandon an in-progress stream. The gateway will
 * stop forwarding events for the given `requestId` and emit a final
 * `cancelled` event. The upstream request is NOT aborted — the LLM
 * continues generating, the gateway just stops forwarding.
 */
export interface ClientCancelMessage {
   type: "cancel";
   requestId: string;
}

// ── Gateway → Client messages ─────────────────────────────────────────────────

/**
 * Every event the gateway sends back carries the originating `requestId`
 * so the client can route events to the correct in-flight request.
 */
export type GatewayMessage =
   | GatewayStreamEvent
   | GatewayPongMessage
   | GatewayCancelledMessage
   | GatewayErrorMessage;

/** Wraps a WireEvent (token / done / error / cascade_*) with a requestId */
export interface GatewayStreamEvent {
   type: "stream_event";
   requestId: string;
   event: WireEvent;
}

export interface GatewayPongMessage {
   type: "pong";
   timestamp: string;
}

export interface GatewayCancelledMessage {
   type: "cancelled";
   requestId: string;
}

/** Top-level protocol error not tied to a specific request (e.g. bad JSON) */
export interface GatewayErrorMessage {
   type: "error";
   code: string;
   error: string;
}

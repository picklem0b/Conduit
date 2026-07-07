import type { ServerWebSocket } from "bun";
import { runCascade, cascadeIsUsable } from "@cascade/cascade.engine";
import { getChatAdapterForModel } from "@providers/chat/chat.registry";
import { loadConfig } from "@config/config.loader";
import { getLicenseState } from "@license/license.state";
import type {
   ClientMessage,
   ClientChatMessage,
   GatewayMessage,
   GatewayStreamEvent
} from "./socket.types";
import type { WireEvent } from "@streaming/stream.types";
import type { ChatMessage } from "@providers/provider.types";

// ── Per-connection state ───────────────────────────────────────────────────────

/**
 * Tracks all in-flight streams for a single WebSocket connection.
 * Key: client-supplied requestId
 * Value: AbortController that signals cancellation to the generator
 */
type ActiveStreams = Map<string, AbortController>;

// ── Send helpers ───────────────────────────────────────────────────────────────

function send(ws: ServerWebSocket<unknown>, msg: GatewayMessage): void {
   try {
      ws.send(JSON.stringify(msg));
   } catch {
      // Connection already closed — ignore
   }
}

function sendStreamEvent(
   ws: ServerWebSocket<unknown>,
   requestId: string,
   event: WireEvent
): void {
   const msg: GatewayStreamEvent = { type: "stream_event", requestId, event };
   send(ws, msg);
}

// ── Connection handler ────────────────────────────────────────────────────────

/**
 * Called by server.ts when Bun upgrades an HTTP request to a WebSocket.
 * Returns the event handlers for this connection's lifecycle.
 *
 * Design:
 * - One `ActiveStreams` map per connection, keyed by client requestId
 * - Each stream runs in its own async loop — no shared generator state
 * - Cancel signals the AbortController; the generator loop checks it after
 *   each event and breaks cleanly without throwing to the caller
 * - The connection close handler cancels all in-flight streams atomically
 */
export function createSocketHandlers() {
   return {
      open(ws: ServerWebSocket<unknown>) {
         (ws as any).__streams = new Map() as ActiveStreams;
         console.log("[ws] Client connected");
      },

      async message(ws: ServerWebSocket<unknown>, raw: string | Buffer) {
         const streams = (ws as any).__streams as ActiveStreams;

         let msg: ClientMessage;
         try {
            msg = JSON.parse(
               typeof raw === "string" ? raw : raw.toString()
            ) as ClientMessage;
         } catch {
            send(ws, {
               type: "error",
               code: "bad_message",
               error: "Message must be a JSON object"
            });
            return;
         }

         switch (msg.type) {
            case "ping":
               send(ws, { type: "pong", timestamp: new Date().toISOString() });
               break;

            case "cancel": {
               const ctrl = streams.get(msg.requestId);
               if (ctrl) {
                  ctrl.abort();
                  streams.delete(msg.requestId);
                  send(ws, { type: "cancelled", requestId: msg.requestId });
               }
               break;
            }

            case "chat":
               handleChatStream(ws, streams, msg);
               break;

            default:
               send(ws, {
                  type: "error",
                  code: "unknown_message_type",
                  error: `Unknown message type: "${(msg as any).type}"`
               });
         }
      },

      close(ws: ServerWebSocket<unknown>) {
         const streams = (ws as any).__streams as ActiveStreams;
         for (const ctrl of streams.values()) ctrl.abort();
         streams.clear();
         console.log("[ws] Client disconnected");
      }
   };
}

// ── Chat stream handler ───────────────────────────────────────────────────────

async function handleChatStream(
   ws: ServerWebSocket<unknown>,
   streams: ActiveStreams,
   req: ClientChatMessage
): Promise<void> {
   const { requestId } = req;

   // Guard: don't allow duplicate requestIds on the same connection
   if (streams.has(requestId)) {
      send(ws, {
         type: "error",
         code: "duplicate_request_id",
         error: `A stream with requestId "${requestId}" is already in progress`
      });
      return;
   }

   // Check version lock before starting the stream
   const licenseState = await getLicenseState();
   if (licenseState.status === "update_required") {
      sendStreamEvent(ws, requestId, {
         type: "error",
         code: "version_locked",
         error: `Conduit ${licenseState.installedVersion} requires update to >= ${licenseState.minimumVersion}`,
         retryable: false
      });
      return;
   }

   const ctrl = new AbortController();
   streams.set(requestId, ctrl);

   const messages: ChatMessage[] = req.messages;
   const config = loadConfig();

   const shouldCascade =
      req.cascadeEnabled && config.features.cascade && cascadeIsUsable();

   let events: AsyncGenerator<WireEvent>;

   if (shouldCascade) {
      const profile = config.cascade.profiles[req.cascadeProfile ?? "balanced"];

      if (!profile) {
         sendStreamEvent(ws, requestId, {
            type: "error",
            code: "unknown",
            error: `Unknown cascade profile: "${req.cascadeProfile}"`,
            retryable: false
         });
         streams.delete(requestId);
         return;
      }

      events = runCascade({
         messages,
         profile,
         preferredModel: req.model,
         conversationId: req.conversationId
      }) as AsyncGenerator<WireEvent>;
   } else {
      const adapter = getChatAdapterForModel(req.model);

      if (!adapter || !adapter.isConfigured()) {
         sendStreamEvent(ws, requestId, {
            type: "error",
            code: "unknown",
            error: adapter
               ? `Provider for "${req.model}" has no API key configured`
               : `Unknown model: "${req.model}"`,
            retryable: false
         });
         streams.delete(requestId);
         return;
      }

      events = (adapter as any).stream(messages, req.model, {
         maxTokens: req.maxTokens,
         temperature: req.temperature,
         systemPrompt: req.systemPrompt
      }) as AsyncGenerator<WireEvent>;
   }

   // ── Forward events ─────────────────────────────────────────────────────────
   try {
      for await (const event of events) {
         if (ctrl.signal.aborted) break;

         sendStreamEvent(ws, requestId, event);

         if (
            event.type === "done" ||
            event.type === "error" ||
            event.type === "cascade_exhausted" ||
            event.type === "cascade_complete"
         ) {
            break;
         }
      }
   } catch (err) {
      if (!ctrl.signal.aborted) {
         sendStreamEvent(ws, requestId, {
            type: "error",
            code: "unknown",
            error: err instanceof Error ? err.message : "Stream failed",
            retryable: false
         });
      }
   } finally {
      streams.delete(requestId);
   }
}

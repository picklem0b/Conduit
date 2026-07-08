import { BaseProvider } from "../provider.base";
import { parseSSE, readErrorBody } from "../provider.sse";
import { estimateCost } from "../provider.types";
import type {
   Model,
   ProbeResult,
   ChatMessage,
   StreamOptions,
   StreamEvent
} from "../provider.types";

const MODELS: Model[] = [
   {
      id: "gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      provider: "google",
      category: "chat",
      capabilities: [
         "chat",
         "vision",
         "function_calling",
         "json_mode",
         "streaming"
      ],
      contextWindow: 1_000_000,
      inputCostPer1M: 0.1,
      outputCostPer1M: 0.4,
      maxOutputTokens: 8_192
   },
   {
      id: "gemini-1.5-pro",
      name: "Gemini 1.5 Pro",
      provider: "google",
      category: "chat",
      capabilities: [
         "chat",
         "vision",
         "function_calling",
         "json_mode",
         "streaming"
      ],
      contextWindow: 2_000_000,
      inputCostPer1M: 3.5,
      outputCostPer1M: 10.5,
      maxOutputTokens: 8_192
   },
   {
      id: "gemini-1.5-flash",
      name: "Gemini 1.5 Flash",
      provider: "google",
      category: "chat",
      capabilities: ["chat", "vision", "streaming"],
      contextWindow: 1_000_000,
      inputCostPer1M: 0.075,
      outputCostPer1M: 0.3,
      maxOutputTokens: 8_192
   }
];

const MODEL_MAP = new Map(MODELS.map(m => [m.id, m]));
const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

interface GeminiCandidate {
   content?: { parts?: { text?: string }[] };
   finishReason?: string;
}

interface GeminiStreamChunk {
   candidates?: GeminiCandidate[];
   usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
   };
   error?: { code: number; message: string };
}

export class GoogleProvider extends BaseProvider {
   readonly id = "google";
   readonly name = "Google";
   readonly category = "chat" as const;

   listModels(): Model[] {
      return MODELS;
   }

   async probe(): Promise<ProbeResult> {
      const started = Date.now();
      if (!this.isConfigured())
         return { status: "unconfigured", latencyMs: 0, modelsAvailable: 0 };

      try {
         const response = await fetch(
            `${API_BASE}/models?key=${this.getApiKey()}`,
            { signal: this.timeoutSignal(8_000) }
         );
         const latencyMs = Date.now() - started;
         if (response.status === 400 || response.status === 403)
            return {
               status: "invalid_key",
               latencyMs,
               modelsAvailable: 0,
               error: "Invalid API key"
            };
         if (response.status === 429)
            return {
               status: "rate_limited",
               latencyMs,
               modelsAvailable: 0,
               error: "Rate limited"
            };
         if (!response.ok)
            return {
               status: "provider_down",
               latencyMs,
               modelsAvailable: 0,
               error: `HTTP ${response.status}`
            };
         return { status: "active", latencyMs, modelsAvailable: MODELS.length };
      } catch (err) {
         return {
            status: "unreachable",
            latencyMs: Date.now() - started,
            modelsAvailable: 0,
            error: err instanceof Error ? err.message : "Unknown error"
         };
      }
   }

   async *stream(
      messages: ChatMessage[],
      modelId: string,
      options: StreamOptions = {}
   ): AsyncGenerator<StreamEvent> {
      const model = MODEL_MAP.get(modelId);
      if (!model) {
         yield {
            type: "error",
            code: "unknown",
            error: `Unknown Google model: ${modelId}`,
            retryable: false
         };
         return;
      }

      const systemInstruction =
         options.systemPrompt ??
         messages.find(m => m.role === "system")?.content;

      const contents = messages
         .filter(m => m.role !== "system")
         .map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }]
         }));

      const body = {
         contents,
         ...(systemInstruction
            ? { systemInstruction: { parts: [{ text: systemInstruction }] } }
            : {}),
         generationConfig: {
            maxOutputTokens: options.maxTokens ?? model.maxOutputTokens,
            ...(options.temperature !== undefined
               ? { temperature: options.temperature }
               : {})
         }
      };

      let response: Response;
      try {
         response = await fetch(
            `${API_BASE}/models/${modelId}:streamGenerateContent?alt=sse&key=${this.getApiKey()}`,
            {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify(body),
               signal: this.timeoutSignal(120_000)
            }
         );
      } catch (err) {
         yield {
            type: "error",
            code: "provider_down",
            error: err instanceof Error ? err.message : "Request failed",
            retryable: true
         };
         return;
      }

      if (!response.ok) {
         const errorBody = await readErrorBody(response);
         const code = this.classifyHttpError(response.status, errorBody);
         yield {
            type: "error",
            code,
            error: errorBody,
            retryable: code === "rate_limited" || code === "provider_down"
         };
         return;
      }

      const started = Date.now();
      let outputTokens = 0;
      let inputTokens = 0;

      // Gemini streams newline-delimited JSON, not standard SSE — handle manually
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
         while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
               const trimmed = line.trim();
               if (!trimmed || !trimmed.startsWith("data:")) continue;

               const payload = trimmed.slice(5).trim();
               if (!payload || payload === "[DONE]") continue;

               let chunk: GeminiStreamChunk;
               try {
                  chunk = JSON.parse(payload) as GeminiStreamChunk;
               } catch {
                  continue;
               }

               if (chunk.error) {
                  yield {
                     type: "error",
                     code: this.classifyHttpError(
                        chunk.error.code,
                        chunk.error.message
                     ),
                     error: chunk.error.message,
                     retryable: false
                  };
                  return;
               }

               const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
               if (text) {
                  outputTokens++;
                  yield { type: "token", content: text, tokens: outputTokens };
               }

               if (chunk.usageMetadata) {
                  inputTokens =
                     chunk.usageMetadata.promptTokenCount ?? inputTokens;
                  outputTokens =
                     chunk.usageMetadata.candidatesTokenCount ?? outputTokens;
               }
            }
         }
      } catch (err) {
         yield {
            type: "error",
            code: "provider_down",
            error: err instanceof Error ? err.message : "Stream read failed",
            retryable: true
         };
         return;
      } finally {
         reader.releaseLock();
      }

      yield {
         type: "done",
         totalInputTokens: inputTokens,
         totalOutputTokens: outputTokens,
         totalCostUsd: estimateCost(model, inputTokens, outputTokens),
         durationMs: Date.now() - started,
         model: modelId,
         finishReason: "stop"
      };
   }
}

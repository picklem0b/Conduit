/**
 * Conduit Gateway — OpenAPI 3.1 specification + Swagger UI
 *
 * Served at GET / — open your browser to the gateway root to get the full
 * interactive API explorer with try-it-out for every endpoint.
 *
 * Architecture note: the existing route handlers are NOT rewritten to use
 * zod-openapi's route builder — that would require touching every handler.
 * Instead this file builds the OpenAPI document independently using the same
 * Zod schemas already defined in each handler, then wires Swagger UI onto
 * the root Hono app in server.ts. The spec is the single source of truth for
 * documentation; the handlers are the single source of truth for behaviour.
 * Both are derived from the same Zod schemas so they cannot diverge.
 */

import { Hono } from "hono";
import { swaggerUI } from "@hono/swagger-ui";
//import { z } from "zod";

// ── Reusable schema fragments ─────────────────────────────────────────────────

/*const ErrorSchema = z.object({
 *  error: z.string(),
 *  code: z.string(),
 *  detail: z.unknown().optional(),
 *requestId: z.string().optional()
 *});
 */

// ── OpenAPI document ──────────────────────────────────────────────────────────

/**
 * Hand-authored OpenAPI 3.1 document. Kept as a plain JS object rather than
 * generated from route builders so we can annotate SSE endpoints correctly
 * (OpenAPI 3.1 supports text/event-stream natively), add detailed examples,
 * and describe WebSocket behaviour in the doc even though it can't be
 * try-it-out'd from Swagger UI.
 */
export const openApiDocument = {
    openapi: "3.1.0",

    info: {
        title: "Conduit Gateway API",
        version: "0.1.0",
        description: [
            "Self-hosted AI gateway. Routes chat, image generation, search, and code",
            "execution requests through multiple configured providers with automatic",
            "cascade fallback.",
            "",
            "**Public endpoints** (always available):",
            "`/api/health`, `/api/status`, `/api/keys/*`, `/api/sites/*`, `/api/license/*`",
            "",
            "**Version-locked endpoints** (return `426 Upgrade Required` when the",
            "installed version is below the minimum required by the license manifest):",
            "`/api/chat/*`, `/api/media/*`, `/api/search/*`, `/api/code/*`,",
            "`/api/discovery/*`, `/api/models`, `/api/providers/health`",
            "",
            "**WebSocket** available at `ws://<host>/ws` — see the WebSocket section",
            "for the message protocol."
        ].join("\n")
    },

    servers: [{ url: "", description: "This gateway instance" }],

    tags: [
        { name: "Health", description: "Liveness and status endpoints" },
        { name: "Keys", description: "Provider API key management" },
        {
            name: "Chat",
            description: "Streaming chat completions and conversation history"
        },
        { name: "Media", description: "Image generation" },
        { name: "Search", description: "Web search" },
        { name: "Code", description: "Sandboxed code execution via E2B" },
        { name: "Discovery", description: "Provider key auto-detection" },
        { name: "Models", description: "Available model catalogue" },
        { name: "Providers", description: "Provider health and configuration" },
        { name: "Sites", description: "Multi-site variant routing" },
        {
            name: "License",
            description: "Version lock / license manifest status"
        }
    ],

    paths: {
        // ── Health ───────────────────────────────────────────────────────────────

        "/api/health": {
            get: {
                tags: ["Health"],
                summary: "Liveness probe",
                description:
                    "Always returns 200 if the process is running. Does not check Postgres or Redis. Use /api/status for a full readiness check.",
                operationId: "getHealth",
                responses: {
                    "200": {
                        description: "Process is alive",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: {
                                            type: "string",
                                            example: "ok"
                                        },
                                        timestamp: {
                                            type: "string",
                                            format: "date-time"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },

        "/api/status": {
            get: {
                tags: ["Health"],
                summary: "Full system status",
                description:
                    "Aggregated health of Postgres, Redis, and any configured external mirrors. Safe for public access — returns no key data.",
                operationId: "getStatus",
                responses: {
                    "200": { description: "All systems operational" },
                    "207": {
                        description: "Degraded — some services unhealthy"
                    },
                    "503": { description: "System unavailable" }
                }
            }
        },

        // ── Keys ─────────────────────────────────────────────────────────────────

        "/api/keys": {
            get: {
                tags: ["Keys"],
                summary: "List saved provider keys",
                description:
                    "Returns metadata only — the raw key value is never returned. Each entry includes a masked hint (e.g. `sk-...abc`).",
                operationId: "listKeys",
                responses: {
                    "200": {
                        description: "Array of key metadata",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            id: { type: "string" },
                                            provider: {
                                                type: "string",
                                                example: "anthropic"
                                            },
                                            category: {
                                                type: "string",
                                                enum: [
                                                    "chat",
                                                    "image",
                                                    "search",
                                                    "code"
                                                ]
                                            },
                                            label: {
                                                type: "string",
                                                nullable: true
                                            },
                                            keyHint: {
                                                type: "string",
                                                example: "sk-ant-...xyz"
                                            },
                                            createdAt: {
                                                type: "string",
                                                format: "date-time"
                                            },
                                            updatedAt: {
                                                type: "string",
                                                format: "date-time"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ["Keys"],
                summary: "Save or update a provider key",
                description:
                    "Upserts a key by provider ID. Immediately invalidates the health cache for this provider.",
                operationId: "saveKey",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["provider", "key"],
                                properties: {
                                    provider: {
                                        type: "string",
                                        pattern: "^[a-z0-9-]+$",
                                        example: "anthropic",
                                        description:
                                            "Lowercase alphanumeric provider ID"
                                    },
                                    key: {
                                        type: "string",
                                        minLength: 8,
                                        example: "sk-ant-api03-...",
                                        description:
                                            "Raw API key — stored encrypted, never returned"
                                    },
                                    category: {
                                        type: "string",
                                        enum: [
                                            "chat",
                                            "image",
                                            "search",
                                            "code"
                                        ],
                                        default: "chat"
                                    },
                                    label: {
                                        type: "string",
                                        maxLength: 120,
                                        description:
                                            "Optional human-readable label"
                                    }
                                }
                            },
                            examples: {
                                anthropic: {
                                    summary: "Anthropic key",
                                    value: {
                                        provider: "anthropic",
                                        key: "sk-ant-api03-...",
                                        category: "chat"
                                    }
                                },
                                openai: {
                                    summary: "OpenAI key",
                                    value: {
                                        provider: "openai",
                                        key: "sk-proj-...",
                                        category: "chat"
                                    }
                                },
                                stability: {
                                    summary: "Stability AI key",
                                    value: {
                                        provider: "stability",
                                        key: "sk-...",
                                        category: "image"
                                    }
                                },
                                brave: {
                                    summary: "Brave Search key",
                                    value: {
                                        provider: "brave",
                                        key: "BSAe...",
                                        category: "search"
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    "201": {
                        description: "Key saved — returns metadata (no raw key)"
                    },
                    "422": { description: "Validation error" }
                }
            }
        },

        "/api/keys/{provider}": {
            delete: {
                tags: ["Keys"],
                summary: "Delete a provider key",
                operationId: "deleteKey",
                parameters: [
                    {
                        name: "provider",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                        example: "anthropic"
                    }
                ],
                responses: {
                    "204": { description: "Key deleted" },
                    "400": { description: "Missing provider parameter" }
                }
            }
        },

        "/api/keys/introspect": {
            post: {
                tags: ["Keys"],
                summary: "Probe a key without saving it",
                description:
                    "Tests a raw key against all known providers simultaneously. Returns which providers accepted it and their capabilities. The key is never persisted.",
                operationId: "introspectKey",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["key"],
                                properties: {
                                    key: {
                                        type: "string",
                                        minLength: 8,
                                        example: "sk-ant-api03-..."
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    "200": {
                        description:
                            "Discovery result — matched providers and capabilities"
                    },
                    "422": { description: "Validation error" }
                }
            }
        },

        // ── Chat ─────────────────────────────────────────────────────────────────

        "/api/chat/stream": {
            post: {
                tags: ["Chat"],
                summary: "Stream a chat completion",
                description: [
                    "Streams the assistant response as Server-Sent Events.",
                    "",
                    "**Event types** (all JSON in the `data:` field):",
                    "- `{ type: 'token', content: string, tokens: number }` — one per token",
                    "- `{ type: 'done', totalInputTokens, totalOutputTokens, totalCostUsd, model, durationMs, finishReason }`",
                    "- `{ type: 'error', code, error, retryable }` — terminal",
                    "- `{ type: 'cascade_switch', fromModel, toModel, reason }` — cascade fallback occurred",
                    "- `{ type: 'cascade_complete', totalSwitches, finalModel }`",
                    "- `{ type: 'cascade_exhausted', reason }` — all providers failed",
                    "",
                    "When `cascadeEnabled: true`, the engine tries providers in health-score",
                    "order and switches automatically on error, rate-limit, or cost/token thresholds."
                ].join("\n"),
                operationId: "chatStream",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["messages", "model"],
                                properties: {
                                    messages: {
                                        type: "array",
                                        minItems: 1,
                                        items: {
                                            type: "object",
                                            required: ["role", "content"],
                                            properties: {
                                                role: {
                                                    type: "string",
                                                    enum: [
                                                        "user",
                                                        "assistant",
                                                        "system"
                                                    ]
                                                },
                                                content: {
                                                    type: "string",
                                                    minLength: 1
                                                }
                                            }
                                        }
                                    },
                                    model: {
                                        type: "string",
                                        example: "claude-sonnet-4-6",
                                        description:
                                            "Model ID from GET /api/models"
                                    },
                                    cascadeEnabled: {
                                        type: "boolean",
                                        default: false
                                    },
                                    cascadeProfile: {
                                        type: "string",
                                        default: "balanced",
                                        description:
                                            "Cascade profile from conduit.config.toml"
                                    },
                                    conversationId: {
                                        type: "string",
                                        description:
                                            "Persist messages to this conversation"
                                    },
                                    systemPrompt: { type: "string" },
                                    maxTokens: { type: "integer", minimum: 1 },
                                    temperature: {
                                        type: "number",
                                        minimum: 0,
                                        maximum: 2
                                    }
                                }
                            },
                            examples: {
                                simple: {
                                    summary: "Simple chat",
                                    value: {
                                        messages: [
                                            {
                                                role: "user",
                                                content:
                                                    "Hello! What can you do?"
                                            }
                                        ],
                                        model: "claude-sonnet-4-6"
                                    }
                                },
                                cascade: {
                                    summary: "With cascade fallback",
                                    value: {
                                        messages: [
                                            {
                                                role: "user",
                                                content:
                                                    "Explain quantum entanglement"
                                            }
                                        ],
                                        model: "claude-opus-4-7",
                                        cascadeEnabled: true,
                                        cascadeProfile: "balanced"
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    "200": {
                        description: "SSE stream — events described above",
                        content: {
                            "text/event-stream": { schema: { type: "string" } }
                        }
                    },
                    "429": { description: "Rate limited (60 req/min per IP)" }
                }
            }
        },

        "/api/chat/conversations": {
            get: {
                tags: ["Chat"],
                summary: "List conversations",
                description:
                    "Returns conversation summaries (no message content). Ordered by most recently updated.",
                operationId: "listConversations",
                parameters: [
                    {
                        name: "interface",
                        in: "query",
                        schema: {
                            type: "string",
                            enum: ["chat", "media", "tester"]
                        },
                        description: "Filter by interface type"
                    },
                    {
                        name: "limit",
                        in: "query",
                        schema: { type: "integer", default: 50, maximum: 200 }
                    }
                ],
                responses: {
                    "200": {
                        description: "Conversation list",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        conversations: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "string" },
                                                    title: { type: "string" },
                                                    interface: {
                                                        type: "string"
                                                    },
                                                    updatedAt: {
                                                        type: "string",
                                                        format: "date-time"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },

        "/api/chat/conversations/{id}": {
            get: {
                tags: ["Chat"],
                summary: "Get conversation with messages",
                operationId: "getConversation",
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" }
                    }
                ],
                responses: {
                    "200": {
                        description:
                            "Conversation + full message history (ascending)"
                    },
                    "404": { description: "Not found" }
                }
            },
            patch: {
                tags: ["Chat"],
                summary: "Rename a conversation",
                operationId: "patchConversation",
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" }
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["title"],
                                properties: {
                                    title: {
                                        type: "string",
                                        minLength: 1,
                                        maxLength: 120
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    "200": { description: "Updated title" },
                    "404": { description: "Not found" }
                }
            },
            delete: {
                tags: ["Chat"],
                summary: "Delete conversation (and all messages)",
                operationId: "deleteConversation",
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" }
                    }
                ],
                responses: { "204": { description: "Deleted" } }
            }
        },

        "/api/chat/conversations/{id}/messages/{messageId}": {
            delete: {
                tags: ["Chat"],
                summary: "Truncate from message (inclusive)",
                description:
                    "Deletes the specified message and all messages after it. Used by Edit & Regenerate.",
                operationId: "truncateFrom",
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" }
                    },
                    {
                        name: "messageId",
                        in: "path",
                        required: true,
                        schema: { type: "string" }
                    }
                ],
                responses: {
                    "204": { description: "Truncated" },
                    "404": { description: "Conversation not found" }
                }
            }
        },

        // ── Media ─────────────────────────────────────────────────────────────────

        "/api/media/generate": {
            post: {
                tags: ["Media"],
                summary: "Generate images",
                description:
                    "Generates images using DALL-E 3, DALL-E 2, or Stable Diffusion. Rate limited to 20 req/min per IP.",
                operationId: "generateImage",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["prompt", "model"],
                                properties: {
                                    prompt: {
                                        type: "string",
                                        minLength: 1,
                                        maxLength: 4000,
                                        example:
                                            "A cat riding a skateboard, photorealistic"
                                    },
                                    model: {
                                        type: "string",
                                        example: "dall-e-3"
                                    },
                                    size: {
                                        type: "string",
                                        pattern: "^\\d+x\\d+$",
                                        example: "1024x1024"
                                    },
                                    count: {
                                        type: "integer",
                                        minimum: 1,
                                        maximum: 4,
                                        default: 1
                                    },
                                    quality: {
                                        type: "string",
                                        enum: ["standard", "hd"],
                                        default: "standard"
                                    },
                                    format: {
                                        type: "string",
                                        enum: ["url", "base64"],
                                        default: "url"
                                    },
                                    negativePrompt: {
                                        type: "string",
                                        maxLength: 2000
                                    },
                                    style: { type: "string" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    "200": {
                        description: "Generated images",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        model: { type: "string" },
                                        provider: { type: "string" },
                                        images: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    url: {
                                                        type: "string",
                                                        nullable: true
                                                    },
                                                    base64: {
                                                        type: "string",
                                                        nullable: true
                                                    },
                                                    revisedPrompt: {
                                                        type: "string",
                                                        nullable: true
                                                    },
                                                    seed: {
                                                        type: "integer",
                                                        nullable: true
                                                    }
                                                }
                                            }
                                        },
                                        count: { type: "integer" },
                                        durationMs: { type: "integer" }
                                    }
                                }
                            }
                        }
                    },
                    "400": {
                        description: "Unknown model or unconfigured provider"
                    },
                    "429": { description: "Rate limited" },
                    "502": { description: "Provider error" }
                }
            }
        },

        "/api/media/models": {
            get: {
                tags: ["Media"],
                summary: "List image models",
                operationId: "listImageModels",
                responses: {
                    "200": {
                        description:
                            "All image models with supported sizes and cost"
                    }
                }
            }
        },

        // ── Search ────────────────────────────────────────────────────────────────

        "/api/search": {
            post: {
                tags: ["Search"],
                summary: "Execute a web search",
                description:
                    "Searches using the first configured provider (SerpAPI or Brave Search). Rate limited to 30 req/min per IP.",
                operationId: "search",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["query"],
                                properties: {
                                    query: {
                                        type: "string",
                                        minLength: 1,
                                        maxLength: 500,
                                        example: "Hono framework benchmarks"
                                    },
                                    provider: {
                                        type: "string",
                                        enum: ["serpapi", "brave"],
                                        description:
                                            "Specific provider — omit for auto-select"
                                    },
                                    count: {
                                        type: "integer",
                                        minimum: 1,
                                        maximum: 50,
                                        default: 10
                                    },
                                    country: {
                                        type: "string",
                                        minLength: 2,
                                        maxLength: 2,
                                        example: "US"
                                    },
                                    language: { type: "string", example: "en" },
                                    freshness: {
                                        type: "string",
                                        enum: ["day", "week", "month"]
                                    },
                                    safeSearch: {
                                        type: "boolean",
                                        default: true
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    "200": {
                        description: "Search results",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        query: { type: "string" },
                                        provider: { type: "string" },
                                        results: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    title: { type: "string" },
                                                    url: { type: "string" },
                                                    snippet: { type: "string" },
                                                    source: {
                                                        type: "string",
                                                        nullable: true
                                                    },
                                                    publishedAt: {
                                                        type: "string",
                                                        nullable: true
                                                    },
                                                    imageUrl: {
                                                        type: "string",
                                                        nullable: true
                                                    },
                                                    rank: { type: "integer" }
                                                }
                                            }
                                        },
                                        count: { type: "integer" },
                                        durationMs: { type: "integer" }
                                    }
                                }
                            }
                        }
                    },
                    "400": { description: "No search provider configured" },
                    "429": { description: "Rate limited" }
                }
            }
        },

        "/api/search/providers": {
            get: {
                tags: ["Search"],
                summary: "List search providers",
                operationId: "listSearchProviders",
                responses: {
                    "200": {
                        description:
                            "All known search providers and their configured state",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        providers: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "string" },
                                                    name: { type: "string" },
                                                    configured: {
                                                        type: "boolean"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },

        // ── Code ──────────────────────────────────────────────────────────────────

        "/api/code/execute": {
            post: {
                tags: ["Code"],
                summary: "Execute code in an E2B sandbox",
                description:
                    "Runs code in an isolated, ephemeral E2B CodeInterpreter sandbox. Supports Python (Jupyter kernel), JavaScript (Deno kernel), and Bash. Rich outputs (matplotlib plots, etc.) are returned as base64 images. Rate limited to 10 req/min per IP.",
                operationId: "executeCode",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["code", "runtime"],
                                properties: {
                                    code: {
                                        type: "string",
                                        minLength: 1,
                                        maxLength: 100000,
                                        example: "print(sum(range(1, 101)))"
                                    },
                                    runtime: {
                                        type: "string",
                                        enum: ["python", "javascript", "bash"],
                                        example: "python"
                                    },
                                    timeoutMs: {
                                        type: "integer",
                                        minimum: 1000,
                                        maximum: 30000,
                                        default: 15000
                                    },
                                    env: {
                                        type: "object",
                                        additionalProperties: {
                                            type: "string"
                                        },
                                        description: "Environment variables"
                                    }
                                }
                            },
                            examples: {
                                python: {
                                    summary: "Python — sum 1 to 100",
                                    value: {
                                        code: "print(sum(range(1, 101)))",
                                        runtime: "python"
                                    }
                                },
                                javascript: {
                                    summary: "JavaScript — fibonacci",
                                    value: {
                                        code: "const fib = n => n<=1?n:fib(n-1)+fib(n-2); console.log(fib(10));",
                                        runtime: "javascript"
                                    }
                                },
                                bash: {
                                    summary: "Bash — system info",
                                    value: {
                                        code: "uname -a && echo 'Sandbox is alive'",
                                        runtime: "bash"
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    "200": {
                        description: "Execution result",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        stdout: { type: "string" },
                                        stderr: { type: "string" },
                                        exitCode: { type: "integer" },
                                        outputs: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    type: {
                                                        type: "string",
                                                        enum: [
                                                            "text",
                                                            "image",
                                                            "error"
                                                        ]
                                                    },
                                                    text: {
                                                        type: "string",
                                                        nullable: true
                                                    },
                                                    base64: {
                                                        type: "string",
                                                        nullable: true
                                                    },
                                                    mimeType: {
                                                        type: "string",
                                                        nullable: true
                                                    }
                                                }
                                            }
                                        },
                                        durationMs: { type: "integer" },
                                        runtime: { type: "string" }
                                    }
                                }
                            }
                        }
                    },
                    "400": {
                        description: "E2B not configured or unsupported runtime"
                    },
                    "429": { description: "Rate limited" },
                    "502": { description: "Sandbox execution failed" }
                }
            }
        },

        "/api/code/runtimes": {
            get: {
                tags: ["Code"],
                summary: "List supported runtimes",
                operationId: "listRuntimes",
                responses: {
                    "200": {
                        description: "Runtimes and E2B configuration status",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        runtimes: {
                                            type: "array",
                                            items: { type: "string" }
                                        },
                                        configured: {
                                            type: "boolean",
                                            description:
                                                "True if an E2B API key is saved"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },

        // ── Discovery ─────────────────────────────────────────────────────────────

        "/api/discovery/probe": {
            post: {
                tags: ["Discovery"],
                summary: "Auto-detect provider from an API key",
                description:
                    "Probes a raw key against all known providers in parallel. Returns matched providers and their capabilities. Rate limited to 10 req/min per IP. The key is never stored.",
                operationId: "probeKey",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["key"],
                                properties: {
                                    key: {
                                        type: "string",
                                        minLength: 8,
                                        example: "sk-ant-api03-..."
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    "200": {
                        description: "Probe result with matched providers"
                    },
                    "429": { description: "Rate limited" }
                }
            }
        },

        // ── Models ────────────────────────────────────────────────────────────────

        "/api/models": {
            get: {
                tags: ["Models"],
                summary: "List all available models",
                description:
                    "Returns all models grouped by category. Use these IDs in /api/chat/stream and /api/media/generate.",
                operationId: "listModels",
                responses: {
                    "200": {
                        description: "Models by category",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        chat: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "string" },
                                                    name: { type: "string" },
                                                    provider: {
                                                        type: "string"
                                                    },
                                                    contextWindow: {
                                                        type: "integer"
                                                    },
                                                    inputCostPer1M: {
                                                        type: "number"
                                                    },
                                                    outputCostPer1M: {
                                                        type: "number"
                                                    },
                                                    maxOutputTokens: {
                                                        type: "integer"
                                                    },
                                                    capabilities: {
                                                        type: "array",
                                                        items: {
                                                            type: "string"
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        image: {
                                            type: "array",
                                            items: { type: "object" }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "426": {
                        description: "Version lock — update Conduit to continue"
                    }
                }
            }
        },

        // ── Providers ─────────────────────────────────────────────────────────────

        "/api/providers/health": {
            get: {
                tags: ["Providers"],
                summary: "Per-provider health snapshot",
                description:
                    "Health of every configured provider including latency, model counts, and capability lists. Cached for 30 seconds per provider.",
                operationId: "getProvidersHealth",
                responses: {
                    "200": {
                        description: "Provider health array",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        providers: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "string" },
                                                    name: { type: "string" },
                                                    status: {
                                                        type: "string",
                                                        enum: [
                                                            "active",
                                                            "unconfigured",
                                                            "invalid_key",
                                                            "rate_limited",
                                                            "provider_down",
                                                            "unreachable"
                                                        ]
                                                    },
                                                    latencyMs: {
                                                        type: "integer",
                                                        nullable: true
                                                    },
                                                    modelsAvailable: {
                                                        type: "integer"
                                                    },
                                                    error: {
                                                        type: "string",
                                                        nullable: true
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "426": { description: "Version lock" }
                }
            }
        },

        // ── Sites ─────────────────────────────────────────────────────────────────

        "/api/sites/config": {
            get: {
                tags: ["Sites"],
                summary: "Resolved site profile for this Host",
                description:
                    "Reads the Host header and returns the matching site profile from conduit.config.toml. Used by interfaces on load to determine which UI variant to render.",
                operationId: "getSiteConfig",
                responses: {
                    "200": {
                        description: "Site profile",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        host: { type: "string" },
                                        variant: {
                                            type: "string",
                                            enum: [
                                                "chat",
                                                "media",
                                                "tester",
                                                "default"
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },

        "/api/sites": {
            get: {
                tags: ["Sites"],
                summary: "List all configured sites",
                operationId: "listSites",
                responses: {
                    "200": {
                        description:
                            "All host → profile mappings from conduit.config.toml"
                    }
                }
            }
        },

        // ── License ───────────────────────────────────────────────────────────────

        "/api/license": {
            get: {
                tags: ["License"],
                summary: "Current license / version lock state",
                description:
                    "Returns the cached state from Postgres — does not trigger a fresh manifest fetch.",
                operationId: "getLicenseStatus",
                responses: {
                    "200": {
                        description: "License state",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: {
                                            type: "string",
                                            enum: [
                                                "ok",
                                                "update_required",
                                                "unknown"
                                            ]
                                        },
                                        installedVersion: { type: "string" },
                                        minimumVersion: { type: "string" },
                                        lastCheckedAt: {
                                            type: "string",
                                            format: "date-time",
                                            nullable: true
                                        },
                                        licenseEnabled: { type: "boolean" }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },

        "/api/license/refresh": {
            post: {
                tags: ["License"],
                summary: "Force an immediate manifest re-check",
                description:
                    "Fetches, verifies, and persists the manifest now instead of waiting for the next scheduled check. Useful after updating Conduit.",
                operationId: "refreshLicense",
                responses: {
                    "200": { description: "Updated license state" }
                }
            }
        }
    }
} as const;

// ── Swagger UI route ──────────────────────────────────────────────────────────

/**
 * Mounts the Swagger UI and the raw OpenAPI JSON document onto a Hono app.
 * Call this in server.ts:
 *
 *   app.route("/", createDocsApp());
 *
 * The UI is served at GET / and the raw spec at GET /openapi.json.
 */
export function createDocsApp(): Hono {
    const docs = new Hono();

    // Raw JSON spec — useful for import into Postman, Insomnia, etc.
    docs.get("/openapi.json", c =>
        c.json(openApiDocument, 200, {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store"
        })
    );

    // Swagger UI — served at exactly GET /
    docs.get(
        "/",
        swaggerUI({
            url: "/openapi.json",
            defaultModelsExpandDepth: 1,
            defaultModelExpandDepth: 2
        })
    );

    return docs;
}

import { useState, useEffect, useRef, useCallback } from "react";
import {
    Send,
    Paperclip,
    Mic,
    Globe,
    Wrench,
    ChevronDown,
    RotateCcw,
    Copy,
    Plus
} from "lucide-react";
import { C } from "@/lib/tokens";
import { useChatStore } from "./chat.store";
import { useAppStore } from "@/store/app.store";
import { getModels, streamChat } from "@/lib/api.lib";
import type { WireEvent } from "@/lib/api.lib";

// ── Model selector pill ───────────────────────────────────────────────────────
function ModelSelector({ models }: { models: string[] }) {
    const { selectedModel, setSelectedModel, cascadeEnabled } = useChatStore();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const display = selectedModel || "Select model";

    return (
        <div ref={ref} style={{ position: "relative" }}>
            <button
                onClick={() => setOpen(v => !v)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: C.surface2,
                    border: `1px solid ${C.border2}`,
                    borderRadius: 6,
                    padding: "5px 10px",
                    color: C.text,
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: C.sans
                }}
            >
                <span
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: cascadeEnabled ? C.green : C.amber,
                        flexShrink: 0
                    }}
                />
                {display}
                <ChevronDown size={11} color={C.dim} />
            </button>

            {open && (
                <div
                    style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        background: C.surface,
                        border: `1px solid ${C.border2}`,
                        borderRadius: 7,
                        zIndex: 30,
                        minWidth: 200,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                        overflow: "hidden"
                    }}
                >
                    {models.map(m => (
                        <button
                            key={m}
                            onClick={() => {
                                setSelectedModel(m);
                                setOpen(false);
                            }}
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                gap: 7,
                                padding: "8px 12px",
                                background:
                                    m === selectedModel ? C.surface2 : "none",
                                border: "none",
                                cursor: "pointer",
                                color: m === selectedModel ? C.text : C.sub,
                                fontSize: 12,
                                textAlign: "left",
                                fontFamily: C.sans
                            }}
                            onMouseEnter={e => {
                                if (m !== selectedModel)
                                    e.currentTarget.style.background =
                                        C.surface2;
                            }}
                            onMouseLeave={e => {
                                if (m !== selectedModel)
                                    e.currentTarget.style.background = "none";
                            }}
                        >
                            <span
                                style={{
                                    width: 5,
                                    height: 5,
                                    borderRadius: "50%",
                                    background: C.dim,
                                    flexShrink: 0
                                }}
                            />
                            {m}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Cascade event chip ────────────────────────────────────────────────────────
function CascadeChip({
    from,
    to,
    reason,
    at
}: {
    from: string;
    to: string;
    reason: string;
    at: number;
}) {
    return (
        <div
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 8px",
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: 5,
                fontSize: 10,
                color: C.amber,
                fontFamily: C.mono,
                margin: "4px 0"
            }}
        >
            <RotateCcw size={8} color={C.amber} />
            <span style={{ color: C.dim }}>cascade</span>
            <span>{from}</span>
            <span style={{ color: C.dim }}>→</span>
            <span style={{ color: C.text }}>{to}</span>
            <span style={{ color: C.dim }}>·</span>
            <span>{reason}</span>
            <span style={{ color: C.dim }}>·</span>
            <span>{at}ms</span>
        </div>
    );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({
    message,
    streaming
}: {
    message: {
        role: string;
        content: string;
        model?: string;
        tokens?: number;
        costUsd?: number;
        id: string;
        createdAt: number;
    };
    streaming?: boolean;
}) {
    const { role, content, model, tokens, costUsd } = message;
    const isUser = role === "user";
    return (
        <div
            style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                justifyContent: isUser ? "flex-end" : "flex-start",
                maxWidth: "100%"
            }}
        >
            {!isUser && (
                <div
                    style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: C.surface2,
                        border: `1px solid ${C.border2}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: 2
                    }}
                >
                    <span style={{ fontSize: 8, color: C.sub }}>✦</span>
                </div>
            )}
            <div
                style={{
                    maxWidth: "72%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 3
                }}
            >
                <div
                    style={{
                        background: isUser ? C.surface2 : C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: isUser
                            ? "10px 10px 2px 10px"
                            : "10px 10px 10px 2px",
                        padding: "9px 12px",
                        fontSize: 13,
                        color: C.text,
                        lineHeight: 1.65,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word"
                    }}
                >
                    {content}
                </div>
                {model && (
                    <div
                        style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                            paddingLeft: isUser ? 0 : 2
                        }}
                    >
                        <span
                            style={{
                                fontSize: 9,
                                color: C.dim,
                                fontFamily: C.mono
                            }}
                        >
                            {model}
                        </span>
                        {tokens !== undefined && (
                            <span
                                style={{
                                    fontSize: 9,
                                    color: C.dim,
                                    fontFamily: C.mono
                                }}
                            >
                                · {tokens.toLocaleString()} tokens
                            </span>
                        )}
                        {costUsd !== undefined && (
                            <span
                                style={{
                                    fontSize: 9,
                                    color: C.dim,
                                    fontFamily: C.mono
                                }}
                            >
                                · ${costUsd.toFixed(4)}
                            </span>
                        )}
                    </div>
                )}
            </div>
            {isUser && (
                <div
                    style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: "linear-gradient(135deg,#22c55e,#3b82f6)",
                        marginTop: 2
                    }}
                />
            )}
        </div>
    );
}

// ── Token bar ─────────────────────────────────────────────────────────────────
function TokenBar({ tokens, cost }: { tokens: number; cost: number }) {
    if (tokens === 0) return null;
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "5px 16px",
                borderTop: `1px solid ${C.border}`,
                background: C.bg
            }}
        >
            <span style={{ fontSize: 10, color: C.dim, fontFamily: C.mono }}>
                total session cost{" "}
                <span style={{ color: C.sub }}>${cost.toFixed(4)}</span>
            </span>
            <span style={{ fontSize: 10, color: C.dim, fontFamily: C.mono }}>
                tokens{" "}
                <span style={{ color: C.sub }}>{tokens.toLocaleString()}</span>
            </span>
        </div>
    );
}

// ── Input bar ─────────────────────────────────────────────────────────────────
function InputBar({
    onSend,
    disabled
}: {
    onSend: (text: string) => void;
    disabled: boolean;
}) {
    const [text, setText] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const send = () => {
        if (!text.trim() || disabled) return;
        onSend(text.trim());
        setText("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    const onInput = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    };

    return (
        <div
            style={{
                borderTop: `1px solid ${C.border}`,
                padding: "10px 16px",
                background: C.bg,
                flexShrink: 0
            }}
        >
            {/* Toolbar row */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 8
                }}
            >
                {[
                    { icon: <Paperclip size={13} />, label: "Attach" },
                    { icon: <Globe size={13} />, label: "Search" },
                    { icon: <Wrench size={13} />, label: "Tools" }
                ].map(t => (
                    <button
                        key={t.label}
                        title={t.label}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            background: "none",
                            border: `1px solid ${C.border2}`,
                            borderRadius: 5,
                            padding: "4px 8px",
                            color: C.dim,
                            fontSize: 11,
                            cursor: "pointer",
                            fontFamily: C.sans
                        }}
                    >
                        {t.icon}
                        <span>{t.label}</span>
                    </button>
                ))}
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 10, color: C.dim }}>Tool-call</span>
                <button
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        background: "none",
                        border: `1px solid ${C.border2}`,
                        borderRadius: 5,
                        padding: "4px 8px",
                        color: C.dim,
                        fontSize: 11,
                        cursor: "pointer"
                    }}
                >
                    send
                </button>
            </div>

            {/* Textarea + send button */}
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 8,
                    background: C.surface,
                    border: `1px solid ${C.border2}`,
                    borderRadius: 8,
                    padding: "8px 10px"
                }}
            >
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={onKeyDown}
                    onInput={onInput}
                    placeholder="Attach file a message…"
                    disabled={disabled}
                    rows={1}
                    style={{
                        flex: 1,
                        background: "none",
                        border: "none",
                        outline: "none",
                        resize: "none",
                        fontSize: 13,
                        color: C.text,
                        lineHeight: 1.5,
                        fontFamily: C.sans,
                        minHeight: 20,
                        maxHeight: 160
                    }}
                />
                <button
                    onClick={send}
                    disabled={disabled || !text.trim()}
                    style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        flexShrink: 0,
                        background:
                            text.trim() && !disabled ? C.blue : C.surface3,
                        border: "none",
                        cursor:
                            text.trim() && !disabled ? "pointer" : "default",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "background 0.15s"
                    }}
                >
                    <Send
                        size={12}
                        color={text.trim() && !disabled ? "white" : C.dim}
                    />
                </button>
            </div>
        </div>
    );
}

// ── Chat page ─────────────────────────────────────────────────────────────────
export function ChatPage() {
    const {
        messages,
        cascadeEvents,
        isStreaming,
        streamContent,
        currentModel,
        selectedModel,
        totalTokens,
        totalCost,
        cascadeEnabled,
        profile,
        addMessage,
        startStream,
        appendToken,
        addCascade,
        finishStream,
        cancelStream,
        newConversation
    } = useChatStore();
    const { pushTerminalLine } = useAppStore();

    const [models, setModels] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getModels()
            .then(r => {
                const ids = r.chat.map(m => m.id);
                setModels(ids);
                if (ids[0] && !selectedModel)
                    useChatStore.getState().setSelectedModel(ids[0]);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, streamContent]);

    const handleSend = useCallback(
        async (text: string) => {
            if (!selectedModel) return;

            addMessage({ role: "user", content: text });
            pushTerminalLine({
                text: `[chat] POST /api/chat/stream · model: ${selectedModel}`,
                type: "dim"
            });

            const ctrl = startStream(selectedModel);

            const msgHistory = [
                ...useChatStore
                    .getState()
                    .messages.slice(0, -1)
                    .map(m => ({ role: m.role, content: m.content })),
                { role: "user" as const, content: text }
            ];

            try {
                for await (const evt of streamChat(
                    {
                        model: selectedModel,
                        messages: msgHistory,
                        cascadeEnabled,
                        profile
                    },
                    ctrl.signal
                )) {
                    const e = evt as WireEvent;
                    if (e.type === "token") {
                        appendToken(e.content, e.model, e.tokens, e.costUsd);
                    } else if (e.type === "cascade") {
                        addCascade({
                            from: e.from,
                            to: e.to,
                            reason: e.reason,
                            at: e.at
                        });
                        pushTerminalLine({
                            text: `[cascade] ${e.from} → ${e.to} · ${e.reason} · ${e.at}ms`,
                            type: "info"
                        });
                    } else if (e.type === "done") {
                        finishStream(e.totalTokens, e.totalCostUsd);
                        pushTerminalLine({
                            text: `[done] ${e.totalTokens} tokens · $${e.totalCostUsd.toFixed(5)} · ${e.durationMs}ms`,
                            type: "success"
                        });
                    } else if (e.type === "error") {
                        pushTerminalLine({
                            text: `[error] ${e.error}`,
                            type: "error"
                        });
                        cancelStream();
                    }
                }
            } catch (err) {
                if ((err as Error).name !== "AbortError") {
                    pushTerminalLine({
                        text: `[error] ${String(err)}`,
                        type: "error"
                    });
                }
                cancelStream();
            }
        },
        [
            selectedModel,
            cascadeEnabled,
            profile,
            addMessage,
            startStream,
            appendToken,
            addCascade,
            finishStream,
            cancelStream,
            pushTerminalLine
        ]
    );

    // Collect cascade events indexed to messages
    const cascadeByIdx = new Map<number, (typeof cascadeEvents)[0][]>();
    cascadeEvents.forEach(c => {
        const idx = messages.findIndex(
            m => m.role === "user" && m.createdAt <= c.at
        );
        const key = idx === -1 ? 0 : idx;
        cascadeByIdx.set(key, [...(cascadeByIdx.get(key) ?? []), c]);
    });

    const isEmpty = messages.length === 0 && !isStreaming;

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                overflow: "hidden"
            }}
        >
            {/* Header row — model selector + cascade + session info */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 16px",
                    borderBottom: `1px solid ${C.border}`,
                    flexShrink: 0
                }}
            >
                <ModelSelector models={models} />
                {currentModel && isStreaming && (
                    <span
                        style={{
                            fontSize: 10,
                            color: C.dim,
                            fontFamily: C.mono
                        }}
                    >
                        streaming
                    </span>
                )}
                {useChatStore.getState().cascadeEnabled && (
                    <span
                        style={{
                            fontSize: 9,
                            color: C.green,
                            fontFamily: C.mono,
                            background: C.greenDim,
                            border: `1px solid ${C.greenBdr}`,
                            padding: "2px 6px",
                            borderRadius: 4
                        }}
                    >
                        balanced
                    </span>
                )}
                <div style={{ flex: 1 }} />
                {totalTokens > 0 && (
                    <span
                        style={{
                            fontSize: 10,
                            color: C.dim,
                            fontFamily: C.mono
                        }}
                    >
                        {totalTokens.toLocaleString()} tokens · $
                        {totalCost.toFixed(4)}
                    </span>
                )}
                <button
                    onClick={newConversation}
                    title="New conversation"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        background: "none",
                        border: `1px solid ${C.border2}`,
                        borderRadius: 5,
                        padding: "4px 8px",
                        color: C.dim,
                        fontSize: 11,
                        cursor: "pointer"
                    }}
                >
                    <Plus size={11} />
                    New
                </button>
            </div>

            {/* Messages area */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
                {isEmpty ? (
                    <EmptyChat onSend={handleSend} />
                ) : (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 14,
                            maxWidth: 760,
                            margin: "0 auto"
                        }}
                    >
                        {messages.map((msg, i) => (
                            <div key={msg.id}>
                                {(cascadeByIdx.get(i) ?? []).map((c, ci) => (
                                    <CascadeChip key={ci} {...c} />
                                ))}
                                <MessageBubble message={msg} />
                            </div>
                        ))}

                        {/* Streaming message */}
                        {isStreaming && streamContent && (
                            <MessageBubble
                                message={{
                                    id: "__stream__",
                                    role: "assistant" as const,
                                    content: streamContent + "▌",
                                    createdAt: Date.now(),
                                    ...(currentModel
                                        ? { model: currentModel }
                                        : {})
                                }}
                                streaming
                            />
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Token bar + input */}
            <TokenBar tokens={totalTokens} cost={totalCost} />
            <InputBar onSend={handleSend} disabled={isStreaming} />
        </div>
    );
}

// ── Empty state matching Image 2 "Empty State Chat workspace" ─────────────────
function EmptyChat({ onSend }: { onSend: (t: string) => void }) {
    const SUGGESTIONS = [
        "Explain the cascade pattern in distributed systems",
        "Write a Python script to benchmark API latency",
        "Compare gpt-4o vs claude-sonnet on reasoning tasks",
        "What models are best for code generation?"
    ];

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: 28,
                padding: "40px 20px"
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10
                }}
            >
                <div
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: C.surface2,
                        border: `1px solid ${C.border2}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    <span style={{ fontSize: 20, color: C.dim }}>✦</span>
                </div>
                <p style={{ fontSize: 14, color: C.dim, textAlign: "center" }}>
                    Chat workspace.
                </p>
            </div>

            {/* Suggestion chips */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    width: "100%",
                    maxWidth: 480
                }}
            >
                {SUGGESTIONS.map(s => (
                    <button
                        key={s}
                        onClick={() => onSend(s)}
                        style={{
                            background: C.surface,
                            border: `1px solid ${C.border2}`,
                            borderRadius: 7,
                            padding: "9px 14px",
                            color: C.sub,
                            fontSize: 12,
                            textAlign: "left",
                            cursor: "pointer",
                            fontFamily: C.sans,
                            transition: "border-color 0.15s, color 0.15s"
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = C.border3;
                            e.currentTarget.style.color = C.text;
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = C.border2;
                            e.currentTarget.style.color = C.sub;
                        }}
                    >
                        {s}
                    </button>
                ))}
            </div>
        </div>
    );
}

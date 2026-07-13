import { useState, useCallback } from "react";
import { Send, Plus, MoreHorizontal, ChevronDown } from "lucide-react";
import { C } from "@/lib/tokens";
import { useAppStore } from "@/store/app.store";
import { streamChat } from "@/lib/api.lib";

interface CompareColumn {
    id: string;
    model: string;
    messages: { role: string; content: string }[];
    streaming: boolean;
    streamContent: string;
    firstToken: number | null;
    tokens: number;
    costUsd: number;
}

const MODELS = [
    "gpt-4o",
    "claude-sonnet-4-6",
    "gemini-2.0-flash",
    "llama-3.3-70b",
    "mistral-large",
    "gpt-4o-mini"
];

let _colId = 0;

function makeCol(model: string): CompareColumn {
    return {
        id: String(++_colId),
        model,
        messages: [],
        streaming: false,
        streamContent: "",
        firstToken: null,
        tokens: 0,
        costUsd: 0
    };
}

function ColHeader({
    col,
    onModelChange,
    onRemove
}: {
    col: CompareColumn;
    onModelChange: (m: string) => void;
    onRemove: () => void;
}) {
    const [open, setOpen] = useState(false);

    return (
        <div
            style={{
                padding: "10px 12px",
                borderBottom: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: C.surface
            }}
        >
            <div style={{ position: "relative", flex: 1 }}>
                <button
                    onClick={() => setOpen(v => !v)}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: C.text,
                        fontSize: 12,
                        fontFamily: C.sans
                    }}
                >
                    <span
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "#74aa9c",
                            flexShrink: 0
                        }}
                    />
                    {col.model}
                    <ChevronDown size={10} color={C.dim} />
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
                            zIndex: 20,
                            minWidth: 180,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                            overflow: "hidden"
                        }}
                    >
                        {MODELS.map(m => (
                            <button
                                key={m}
                                onClick={() => {
                                    onModelChange(m);
                                    setOpen(false);
                                }}
                                style={{
                                    width: "100%",
                                    padding: "7px 12px",
                                    background:
                                        m === col.model ? C.surface2 : "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: m === col.model ? C.text : C.sub,
                                    fontSize: 12,
                                    textAlign: "left",
                                    fontFamily: C.sans
                                }}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Stats pills */}
            {col.firstToken !== null && (
                <span style={{ fontSize: 9, color: C.dim, fontFamily: C.mono }}>
                    {col.firstToken}ms first token
                </span>
            )}
            {col.costUsd > 0 && (
                <span style={{ fontSize: 9, color: C.dim, fontFamily: C.mono }}>
                    ${col.costUsd.toFixed(3)}
                </span>
            )}
            {col.tokens > 0 && (
                <span style={{ fontSize: 9, color: C.dim, fontFamily: C.mono }}>
                    {col.tokens.toLocaleString()} tokens
                </span>
            )}

            <button
                onClick={onRemove}
                style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: C.dim,
                    display: "flex",
                    padding: "2px"
                }}
            >
                <MoreHorizontal size={13} />
            </button>
        </div>
    );
}

function MessageItem({ role, content }: { role: string; content: string }) {
    const isUser = role === "user";
    return (
        <div
            style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
                padding: "8px 0"
            }}
        >
            <div
                style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: isUser
                        ? "linear-gradient(135deg,#22c55e,#3b82f6)"
                        : C.surface2,
                    border: isUser ? "none" : `1px solid ${C.border2}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 2
                }}
            >
                {!isUser && (
                    <span style={{ fontSize: 7, color: C.sub }}>✦</span>
                )}
            </div>
            <div
                style={{
                    fontSize: 12,
                    color: C.text,
                    lineHeight: 1.65,
                    flex: 1,
                    minWidth: 0,
                    wordBreak: "break-word"
                }}
            >
                {content}
            </div>
        </div>
    );
}

export function ComparePage() {
    const [columns, setColumns] = useState<CompareColumn[]>([
        makeCol("gpt-4o"),
        makeCol("claude-sonnet-4-6")
    ]);
    const [prompt, setPrompt] = useState("");
    const { pushTerminalLine } = useAppStore();

    const addColumn = () => {
        if (columns.length >= 4) return;
        setColumns(cols => [
            ...cols,
            makeCol(MODELS[cols.length % MODELS.length])
        ]);
    };

    const removeColumn = (id: string) => {
        setColumns(cols => cols.filter(c => c.id !== id));
    };

    const updateColumn = (id: string, patch: Partial<CompareColumn>) => {
        setColumns(cols =>
            cols.map(c => (c.id === id ? { ...c, ...patch } : c))
        );
    };

    const runAll = useCallback(async () => {
        if (!prompt.trim()) return;
        const text = prompt.trim();
        setPrompt("");

        // Add user message to all cols
        setColumns(cols =>
            cols.map(c => ({
                ...c,
                messages: [...c.messages, { role: "user", content: text }],
                streaming: true,
                streamContent: "",
                firstToken: null
            }))
        );

        // Stream each column independently
        await Promise.allSettled(
            columns.map(async col => {
                const start = Date.now();
                let firstToken: number | null = null;
                let accumulated = "";
                let tokens = 0;
                let cost = 0;

                try {
                    const ctrl = new AbortController();
                    for await (const evt of streamChat(
                        {
                            model: col.model,
                            messages: [{ role: "user", content: text }]
                        },
                        ctrl.signal
                    )) {
                        if (evt.type === "token") {
                            if (firstToken === null)
                                firstToken = Date.now() - start;
                            accumulated += evt.content;
                            tokens += evt.tokens;
                            cost += evt.costUsd;
                            updateColumn(col.id, {
                                streamContent: accumulated,
                                firstToken,
                                tokens,
                                costUsd: cost
                            });
                        } else if (evt.type === "done") {
                            updateColumn(col.id, {
                                streaming: false,
                                messages: [
                                    ...col.messages,
                                    { role: "user", content: text },
                                    { role: "assistant", content: accumulated }
                                ],
                                streamContent: "",
                                tokens: evt.totalTokens,
                                costUsd: evt.totalCostUsd
                            });
                            pushTerminalLine({
                                text: `[${col.model}] first token · ${firstToken}ms · ${evt.totalTokens} tokens`,
                                type: "dim"
                            });
                        }
                    }
                } catch {
                    updateColumn(col.id, {
                        streaming: false,
                        streamContent: ""
                    });
                }
            })
        );
    }, [columns, prompt, pushTerminalLine]);

    const colWidth = `${Math.floor(100 / columns.length)}%`;

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                overflow: "hidden"
            }}
        >
            {/* Columns area */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                {columns.map((col, i) => (
                    <div
                        key={col.id}
                        style={{
                            width: colWidth,
                            flexShrink: 0,
                            display: "flex",
                            flexDirection: "column",
                            borderRight:
                                i < columns.length - 1
                                    ? `1px solid ${C.border}`
                                    : "none",
                            overflow: "hidden"
                        }}
                    >
                        <ColHeader
                            col={col}
                            onModelChange={m =>
                                updateColumn(col.id, { model: m })
                            }
                            onRemove={() => removeColumn(col.id)}
                        />
                        <div
                            style={{
                                flex: 1,
                                overflowY: "auto",
                                padding: "10px 12px"
                            }}
                        >
                            {col.messages.map((msg, mi) => (
                                <MessageItem
                                    key={mi}
                                    role={msg.role}
                                    content={msg.content}
                                />
                            ))}
                            {col.streaming && col.streamContent && (
                                <MessageItem
                                    role="assistant"
                                    content={col.streamContent + "▌"}
                                />
                            )}
                        </div>
                    </div>
                ))}

                {/* Add column button */}
                {columns.length < 4 && (
                    <button
                        onClick={addColumn}
                        style={{
                            width: 40,
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "none",
                            border: "none",
                            borderLeft: `1px solid ${C.border}`,
                            cursor: "pointer",
                            color: C.dim
                        }}
                    >
                        <Plus size={14} />
                    </button>
                )}
            </div>

            {/* Shared input bar */}
            <div
                style={{
                    borderTop: `1px solid ${C.border}`,
                    padding: "10px 16px",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: C.bg
                }}
            >
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        gap: 6,
                        alignItems: "center"
                    }}
                >
                    {/* Tool-call toggle */}
                    <span style={{ fontSize: 11, color: C.dim }}>
                        Tool-call
                    </span>
                    <div
                        style={{
                            display: "flex",
                            background: C.surface2,
                            border: `1px solid ${C.border2}`,
                            borderRadius: 5,
                            overflow: "hidden"
                        }}
                    >
                        {["off", "on"].map(v => (
                            <button
                                key={v}
                                style={{
                                    padding: "3px 8px",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: 10,
                                    color: v === "off" ? C.text : C.dim
                                }}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>

                <div
                    style={{
                        flex: 3,
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        background: C.surface,
                        border: `1px solid ${C.border2}`,
                        borderRadius: 7,
                        padding: "7px 10px"
                    }}
                >
                    <input
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        onKeyDown={e =>
                            e.key === "Enter" && !e.shiftKey && runAll()
                        }
                        placeholder="Attach file a message…"
                        style={{
                            flex: 1,
                            background: "none",
                            border: "none",
                            outline: "none",
                            fontSize: 13,
                            color: C.text,
                            fontFamily: C.sans
                        }}
                    />
                    <button
                        onClick={runAll}
                        disabled={
                            !prompt.trim() || columns.some(c => c.streaming)
                        }
                        style={{
                            width: 26,
                            height: 26,
                            borderRadius: 5,
                            border: "none",
                            background: prompt.trim() ? C.blue : C.surface3,
                            cursor: prompt.trim() ? "pointer" : "default",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        <Send
                            size={11}
                            color={prompt.trim() ? "white" : C.dim}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
}

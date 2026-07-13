import { useState } from "react";
import { Upload, Send, Plus, ChevronDown } from "lucide-react";
import { C } from "@/lib/tokens";
import { useAppStore } from "@/store/app.store";

interface Doc {
    name: string;
    chunks: number;
    indexed: boolean;
}
interface Message {
    role: string;
    content: string;
    sources?: string[];
}

const EMBED_MODELS = [
    "text-embedding-3-small",
    "text-embedding-ada-002",
    "nomic-embed-text"
];
const CHUNK_SIZES = [256, 512, 1024, 2048];

const FAKE_DOCS: Doc[] = [
    { name: "query-and-drop zone", chunks: 34, indexed: true },
    { name: "indexed document ···", chunks: 2, indexed: true }
];

export function RagPage() {
    const [docs, setDocs] = useState<Doc[]>(FAKE_DOCS);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Hey, theih responses have satellite cobiliored document.",
            sources: ["query-and-drop zone", "indexed document"]
        }
    ]);
    const [input, setInput] = useState("");
    const [embedModel, setEmbedModel] = useState(EMBED_MODELS[0]);
    const [chunkSize, setChunkSize] = useState(512);
    const [overlap, setOverlap] = useState(64);
    const [ragOn, setRagOn] = useState(true);
    const { pushTerminalLine } = useAppStore();

    const send = async () => {
        if (!input.trim()) return;
        const text = input.trim();
        setInput("");
        setMessages(m => [...m, { role: "user", content: text }]);
        pushTerminalLine({
            text: `[rag] query_embed: 12ms · retrieved: 4 · tap_score: 0.94`,
            type: "dim"
        });
        await new Promise(r => setTimeout(r, 800));
        setMessages(m => [
            ...m,
            {
                role: "assistant",
                content: `Based on the indexed documents, here is what I found relevant to "${text}": The retrieved chunks indicate relevant context with high similarity scores.`,
                sources: docs.filter(d => d.indexed).map(d => d.name)
            }
        ]);
    };

    return (
        <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
            {/* Left: document management */}
            <div
                style={{
                    width: 260,
                    flexShrink: 0,
                    borderRight: `1px solid ${C.border}`,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                }}
            >
                {/* Config */}
                <div
                    style={{
                        padding: "10px 12px",
                        borderBottom: `1px solid ${C.border}`
                    }}
                >
                    <div
                        style={{
                            fontSize: 10,
                            color: C.dim,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            marginBottom: 8
                        }}
                    >
                        Config
                    </div>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6
                        }}
                    >
                        <ConfigRow label="embed model" value={embedModel}>
                            <select
                                value={embedModel}
                                onChange={e => setEmbedModel(e.target.value)}
                                style={selectStyle}
                            >
                                {EMBED_MODELS.map(m => (
                                    <option key={m} value={m}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                        </ConfigRow>
                        <ConfigRow label="chunk size">
                            <select
                                value={chunkSize}
                                onChange={e =>
                                    setChunkSize(Number(e.target.value))
                                }
                                style={selectStyle}
                            >
                                {CHUNK_SIZES.map(s => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </ConfigRow>
                        <ConfigRow label="overlap">
                            <input
                                type="number"
                                value={overlap}
                                onChange={e =>
                                    setOverlap(Number(e.target.value))
                                }
                                style={{ ...inputStyle, width: 60 }}
                            />
                        </ConfigRow>
                        <ConfigRow label="RAG">
                            <button
                                onClick={() => setRagOn(v => !v)}
                                style={{
                                    padding: "2px 8px",
                                    borderRadius: 4,
                                    border: "none",
                                    cursor: "pointer",
                                    background: ragOn ? C.greenDim : C.surface2,
                                    color: ragOn ? C.green : C.dim,
                                    fontSize: 10,
                                    fontFamily: C.mono
                                }}
                            >
                                {ragOn ? "On" : "Off"}
                            </button>
                        </ConfigRow>
                    </div>
                </div>

                {/* Documents */}
                <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "4px 12px 6px"
                        }}
                    >
                        <span
                            style={{
                                fontSize: 10,
                                color: C.dim,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em"
                            }}
                        >
                            Documents
                        </span>
                        <button
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: C.dim,
                                fontSize: 10
                            }}
                        >
                            <Plus size={10} />
                            Add
                        </button>
                    </div>
                    {docs.map((doc, i) => (
                        <div
                            key={i}
                            style={{
                                padding: "7px 12px",
                                display: "flex",
                                alignItems: "center",
                                gap: 7,
                                borderBottom: `1px solid ${C.border}`
                            }}
                        >
                            <span
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: "50%",
                                    flexShrink: 0,
                                    background: doc.indexed ? C.green : C.amber
                                }}
                            />
                            <span
                                style={{
                                    fontSize: 11,
                                    color: C.sub,
                                    flex: 1,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap"
                                }}
                            >
                                {doc.name}
                            </span>
                            <span
                                style={{
                                    fontSize: 9,
                                    color: C.dim,
                                    fontFamily: C.mono,
                                    flexShrink: 0
                                }}
                            >
                                {doc.chunks}
                            </span>
                            <span
                                style={{
                                    fontSize: 9,
                                    color: doc.indexed ? C.green : C.amber,
                                    flexShrink: 0
                                }}
                            >
                                {doc.indexed ? "embed" : "pending"}
                            </span>
                        </div>
                    ))}

                    {/* Drop zone */}
                    <div
                        style={{
                            margin: "8px 12px",
                            border: `1px dashed ${C.border2}`,
                            borderRadius: 7,
                            padding: "14px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 6,
                            cursor: "pointer"
                        }}
                    >
                        <Upload size={14} color={C.dim} />
                        <span
                            style={{
                                fontSize: 10,
                                color: C.dim,
                                textAlign: "center"
                            }}
                        >
                            Drop files here or browse
                        </span>
                    </div>
                </div>
            </div>

            {/* Right: chat + metrics */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                }}
            >
                {/* Header stats */}
                <div
                    style={{
                        padding: "6px 14px",
                        borderBottom: `1px solid ${C.border}`,
                        display: "flex",
                        gap: 14,
                        alignItems: "center"
                    }}
                >
                    {[
                        { l: "Wdoced tunnel", v: "34" },
                        { l: "Infoced document", v: "2" },
                        { l: "embed (fceb)", v: "On" }
                    ].map(s => (
                        <div
                            key={s.l}
                            style={{
                                display: "flex",
                                gap: 4,
                                alignItems: "center"
                            }}
                        >
                            <span style={{ fontSize: 9, color: C.dim }}>
                                {s.l}
                            </span>
                            <span
                                style={{
                                    fontSize: 10,
                                    color: C.sub,
                                    fontFamily: C.mono,
                                    fontWeight: 600
                                }}
                            >
                                {s.v}
                            </span>
                        </div>
                    ))}
                    <div style={{ flex: 1 }} />
                    <span style={{ fontSize: 10, color: C.dim }}>
                        Compress context
                    </span>
                    <button
                        style={{
                            padding: "4px 9px",
                            background: C.blueDim,
                            border: `1px solid ${C.blueBdr}`,
                            borderRadius: 5,
                            color: C.blue,
                            fontSize: 10,
                            cursor: "pointer"
                        }}
                    >
                        Start non flixed
                    </button>
                </div>

                {/* Messages */}
                <div
                    style={{ flex: 1, overflow: "auto", padding: "12px 14px" }}
                >
                    {messages.map((msg, i) => (
                        <div key={i} style={{ marginBottom: 12 }}>
                            <div
                                style={{
                                    fontSize: 12,
                                    color: C.text,
                                    lineHeight: 1.65,
                                    background:
                                        msg.role === "user"
                                            ? C.surface2
                                            : "none",
                                    border:
                                        msg.role === "user"
                                            ? `1px solid ${C.border}`
                                            : "none",
                                    borderRadius:
                                        msg.role === "user"
                                            ? "8px 8px 2px 8px"
                                            : 0,
                                    padding:
                                        msg.role === "user" ? "8px 11px" : 0,
                                    maxWidth:
                                        msg.role === "user" ? "70%" : "100%",
                                    marginLeft: msg.role === "user" ? "auto" : 0
                                }}
                            >
                                {msg.content}
                            </div>
                            {msg.sources && (
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 5,
                                        marginTop: 5,
                                        flexWrap: "wrap"
                                    }}
                                >
                                    {msg.sources.map((s, si) => (
                                        <span
                                            key={si}
                                            style={{
                                                fontSize: 9,
                                                color: C.dim,
                                                fontFamily: C.mono,
                                                background: C.surface,
                                                border: `1px solid ${C.border2}`,
                                                padding: "2px 6px",
                                                borderRadius: 3
                                            }}
                                        >
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Metrics strip */}
                <div
                    style={{
                        borderTop: `1px solid ${C.border}`,
                        padding: "6px 14px",
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: 8,
                        flexShrink: 0,
                        background: C.surface
                    }}
                >
                    {[
                        { l: "Model", v: "Requests", sub: "Endpoint" },
                        { l: "POST", v: "Status", sub: "Latency" },
                        { l: "gpt-4o", v: "200", sub: "5ms" },
                        { l: "OET", v: "conduit.obt", sub: "5ms" }
                    ].map((r, i) => (
                        <div
                            key={i}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 1
                            }}
                        >
                            <span style={{ fontSize: 8, color: C.dim }}>
                                {r.l}
                            </span>
                            <span
                                style={{
                                    fontSize: 10,
                                    color: C.sub,
                                    fontFamily: C.mono
                                }}
                            >
                                {r.v}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Input */}
                <div
                    style={{
                        padding: "8px 14px",
                        borderTop: `1px solid ${C.border}`,
                        display: "flex",
                        gap: 8,
                        flexShrink: 0
                    }}
                >
                    <div
                        style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                            background: C.surface,
                            border: `1px solid ${C.border2}`,
                            borderRadius: 7,
                            padding: "7px 10px"
                        }}
                    >
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && send()}
                            placeholder="Send a message…"
                            style={{
                                flex: 1,
                                background: "none",
                                border: "none",
                                outline: "none",
                                fontSize: 12,
                                color: C.text,
                                fontFamily: C.sans
                            }}
                        />
                    </div>
                    <button
                        onClick={send}
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            background: C.blue,
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        <Send size={12} color="white" />
                    </button>
                </div>
            </div>
        </div>
    );
}

const selectStyle: React.CSSProperties = {
    background: C.surface2,
    border: `1px solid ${C.border2}`,
    borderRadius: 4,
    padding: "3px 6px",
    color: C.sub,
    fontSize: 10,
    fontFamily: C.mono,
    outline: "none",
    cursor: "pointer"
};
const inputStyle: React.CSSProperties = {
    background: C.surface2,
    border: `1px solid ${C.border2}`,
    borderRadius: 4,
    padding: "3px 6px",
    color: C.sub,
    fontSize: 10,
    fontFamily: C.mono,
    outline: "none"
};
function ConfigRow({
    label,
    value,
    children
}: {
    label: string;
    value?: string;
    children: React.ReactNode;
}) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8
            }}
        >
            <span style={{ fontSize: 10, color: C.dim, flexShrink: 0 }}>
                {label}
            </span>
            {children}
        </div>
    );
}

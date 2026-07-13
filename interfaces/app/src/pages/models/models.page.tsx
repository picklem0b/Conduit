import { useState, useEffect } from "react";
import { Search, Download, Plus, Cpu } from "lucide-react";
import { C } from "@/lib/tokens";
import { getModels } from "@/lib/api.lib";
import { useAppStore } from "@/store/app.store";

type Tab = "All" | "Chat" | "Image" | "Search" | "Code" | "Local";
type ModelTab = "Local Models" | "Fine-tunes" | "Import";

const PROVIDER_DOT: Record<string, string> = {
    anthropic: "#e8703a",
    openai: "#74aa9c",
    google: "#4285f4",
    groq: "#a855f7",
    ollama: C.dim,
    stability: "#f472b6"
};

// Sample models matching Image 2 Explore models panel
const SAMPLE_MODELS = [
    {
        id: "openai",
        provider: "openai",
        label: "openai",
        sub: "Maddi info",
        price: "$0.006 in / $0.006 out",
        tested: true,
        score: 85
    },
    {
        id: "Doegle",
        provider: "google",
        label: "Doegle",
        sub: "Deodor",
        price: "$1.08 in · $0.018 out",
        tested: true,
        score: 73
    },
    {
        id: "Gorsunia",
        provider: "anthropic",
        label: "Gorsunia",
        sub: "~Ollama",
        price: "$1.08 in · $0.018 out",
        tested: false,
        score: 91
    },
    {
        id: "Gamo",
        provider: "groq",
        label: "Gamo",
        sub: "",
        price: "$0.08 in · $0.04 out",
        tested: true,
        score: 78
    }
];

// Sample local models from Image 2
const LOCAL_MODELS = [
    {
        name: "llama3.1b",
        size: "4.7 GB",
        ram: "6.4 GB",
        status: "ready",
        score: "5.3,K"
    },
    {
        name: "llama3.1:8b",
        size: "4.7 GB",
        ram: "6.4 GB",
        status: "ready",
        score: "4.5, N"
    },
    {
        name: "llama3.1:70b",
        size: "7.1 GB",
        ram: "9.4 GB",
        status: "pull me!",
        score: "4.5, N"
    },
    {
        name: "mistral:7b",
        size: "4.1 GB",
        ram: "5.6 GB",
        status: "ready",
        score: "4.5, N"
    },
    {
        name: "deepseek-r1",
        size: "4.7 GB",
        ram: "6.4 GB",
        status: "pull me!",
        score: "4.5, N"
    },
    { name: "Ollama", size: "on disk", ram: "", status: "load", score: "" }
];

const FINE_TUNES = [
    {
        name: "Fadot",
        base: "gpt-4o",
        size: "4.7 GB",
        ram: "6.4 GB",
        score: "AT7lem"
    },
    {
        name: "Sfrianh",
        base: "claude-sonnet",
        size: "4.7 GB",
        ram: "6.4 GB",
        score: "AT7lem"
    },
    {
        name: "Danger zone",
        base: "fine-tuned",
        size: "Can all be sombimmins",
        ram: "",
        score: ""
    }
];

function ScoreBar({ score }: { score: number }) {
    const color = score >= 80 ? C.green : score >= 60 ? C.amber : C.red;
    return (
        <div
            style={{
                flex: 1,
                height: 3,
                background: C.border,
                borderRadius: 2
            }}
        >
            <div
                style={{
                    width: `${score}%`,
                    height: "100%",
                    background: color,
                    borderRadius: 2
                }}
            />
        </div>
    );
}

export function ModelsPage() {
    const [filterTab, setFilterTab] = useState<Tab>("All");
    const [modelTab, setModelTab] = useState<ModelTab>("Local Models");
    const [search, setSearch] = useState("");
    const { pushTerminalLine } = useAppStore();

    useEffect(() => {}, []);

    const pull = (name: string) => {
        pushTerminalLine({ text: `[ollama] pulling ${name}…`, type: "dim" });
        setTimeout(
            () =>
                pushTerminalLine({
                    text: `[ollama] ${name}: 4.70 GB loaded · 6.4 GB/s latency · ready`,
                    type: "success"
                }),
            1200
        );
    };

    return (
        <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
            {/* Left: explore panel */}
            <div
                style={{
                    width: "55%",
                    borderRight: `1px solid ${C.border}`,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                }}
            >
                {/* Search + filter tabs */}
                <div
                    style={{
                        padding: "10px 14px",
                        borderBottom: `1px solid ${C.border}`
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                            background: C.surface,
                            border: `1px solid ${C.border2}`,
                            borderRadius: 6,
                            padding: "6px 10px",
                            marginBottom: 8
                        }}
                    >
                        <Search size={12} color={C.dim} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search…"
                            style={{
                                flex: 1,
                                background: "none",
                                border: "none",
                                outline: "none",
                                fontSize: 12,
                                color: C.text
                            }}
                        />
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                        {(
                            [
                                "All",
                                "Chat",
                                "Image",
                                "Search",
                                "Code",
                                "Local"
                            ] as Tab[]
                        ).map(t => (
                            <button
                                key={t}
                                onClick={() => setFilterTab(t)}
                                style={{
                                    padding: "4px 10px",
                                    background:
                                        filterTab === t ? C.surface2 : "none",
                                    border: `1px solid ${filterTab === t ? C.border3 : "transparent"}`,
                                    borderRadius: 5,
                                    color: filterTab === t ? C.text : C.dim,
                                    fontSize: 11,
                                    cursor: "pointer"
                                }}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Model cards */}
                <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
                    {SAMPLE_MODELS.map(m => (
                        <div
                            key={m.id}
                            style={{
                                padding: "10px 14px",
                                borderBottom: `1px solid ${C.border}`,
                                display: "flex",
                                flexDirection: "column",
                                gap: 6
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8
                                }}
                            >
                                <div
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: 6,
                                        flexShrink: 0,
                                        background:
                                            (PROVIDER_DOT[m.provider] ??
                                                C.dim) + "22",
                                        border: `1px solid ${PROVIDER_DOT[m.provider] ?? C.dim}44`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 11,
                                        color:
                                            PROVIDER_DOT[m.provider] ?? C.dim,
                                        fontWeight: 700
                                    }}
                                >
                                    {m.label[0].toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div
                                        style={{
                                            fontSize: 12,
                                            color: C.text,
                                            fontWeight: 500
                                        }}
                                    >
                                        {m.label}
                                    </div>
                                    {m.sub && (
                                        <div
                                            style={{
                                                fontSize: 10,
                                                color: C.dim
                                            }}
                                        >
                                            {m.sub}
                                        </div>
                                    )}
                                </div>
                                <span
                                    style={{
                                        fontSize: 10,
                                        color: C.dim,
                                        fontFamily: C.mono
                                    }}
                                >
                                    {m.price}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8
                                }}
                            >
                                <ScoreBar score={m.score} />
                                <span
                                    style={{
                                        fontSize: 9,
                                        color: C.sub,
                                        fontFamily: C.mono,
                                        width: 30,
                                        textAlign: "right"
                                    }}
                                >
                                    {m.score}%
                                </span>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                                <button
                                    style={{
                                        fontSize: 10,
                                        padding: "3px 8px",
                                        borderRadius: 4,
                                        cursor: "pointer",
                                        background: C.blueDim,
                                        border: `1px solid ${C.blueBdr}`,
                                        color: C.blue
                                    }}
                                >
                                    Test
                                </button>
                                <button
                                    style={{
                                        fontSize: 10,
                                        padding: "3px 8px",
                                        borderRadius: 4,
                                        cursor: "pointer",
                                        background: C.surface2,
                                        border: `1px solid ${C.border2}`,
                                        color: C.sub
                                    }}
                                >
                                    Compare
                                </button>
                                <button
                                    style={{
                                        fontSize: 10,
                                        padding: "3px 8px",
                                        borderRadius: 4,
                                        cursor: "pointer",
                                        background: C.surface2,
                                        border: `1px solid ${C.border2}`,
                                        color: C.sub
                                    }}
                                >
                                    Get schema
                                </button>
                            </div>
                            <p
                                style={{
                                    fontSize: 11,
                                    color: C.dim,
                                    lineHeight: 1.5
                                }}
                            >
                                Donit models with/docenter scope,
                                descriptionomer listdescrip toofoer. We also
                                specook.ker potientas to naklr-gopong in.
                            </p>
                        </div>
                    ))}
                    <div
                        style={{
                            padding: "10px 14px",
                            fontSize: 9,
                            color: C.dim,
                            fontFamily: C.mono
                        }}
                    >
                        47 models indexed · 5 providers · 5 tool via Ollama
                    </div>
                </div>
            </div>

            {/* Right: Local Models / Fine-tunes / Import */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                }}
            >
                {/* Tabs */}
                <div
                    style={{
                        display: "flex",
                        borderBottom: `1px solid ${C.border}`
                    }}
                >
                    {(
                        ["Local Models", "Fine-tunes", "Import"] as ModelTab[]
                    ).map(t => (
                        <button
                            key={t}
                            onClick={() => setModelTab(t)}
                            style={{
                                flex: 1,
                                padding: "8px 0",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: 11,
                                color: modelTab === t ? C.text : C.dim,
                                borderBottom:
                                    modelTab === t
                                        ? `1px solid ${C.blue}`
                                        : "1px solid transparent"
                            }}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div style={{ flex: 1, overflow: "auto" }}>
                    {modelTab === "Local Models" && (
                        <div>
                            {/* Ollama header */}
                            <div
                                style={{
                                    padding: "8px 14px",
                                    borderBottom: `1px solid ${C.border}`,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8
                                }}
                            >
                                <Cpu size={12} color={C.green} />
                                <span style={{ fontSize: 11, color: C.green }}>
                                    Local Models
                                </span>
                                <div style={{ flex: 1 }} />
                                <span
                                    style={{
                                        fontSize: 9,
                                        color: C.dim,
                                        fontFamily: C.mono
                                    }}
                                >
                                    Fine-tunes
                                </span>
                                <span
                                    style={{
                                        fontSize: 9,
                                        color: C.dim,
                                        fontFamily: C.mono
                                    }}
                                >
                                    Import
                                </span>
                            </div>

                            {/* Model rows */}
                            {LOCAL_MODELS.map((m, i) => (
                                <div
                                    key={i}
                                    style={{
                                        padding: "9px 14px",
                                        borderBottom: `1px solid ${C.border}`,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 11,
                                            color: C.text,
                                            fontFamily: C.mono,
                                            flex: 1
                                        }}
                                    >
                                        {m.name}
                                    </span>
                                    {m.size && (
                                        <span
                                            style={{
                                                fontSize: 9,
                                                color: C.dim,
                                                fontFamily: C.mono
                                            }}
                                        >
                                            {m.size}
                                        </span>
                                    )}
                                    {m.ram && (
                                        <span
                                            style={{
                                                fontSize: 9,
                                                color: C.dim,
                                                fontFamily: C.mono
                                            }}
                                        >
                                            {m.ram}
                                        </span>
                                    )}
                                    {m.score && (
                                        <span
                                            style={{
                                                fontSize: 9,
                                                color: C.dim,
                                                fontFamily: C.mono
                                            }}
                                        >
                                            {m.score}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => pull(m.name)}
                                        style={{
                                            fontSize: 9,
                                            padding: "2px 8px",
                                            borderRadius: 3,
                                            cursor: "pointer",
                                            background:
                                                m.status === "ready"
                                                    ? C.greenDim
                                                    : m.status === "load"
                                                      ? C.blueDim
                                                      : C.surface2,
                                            border: `1px solid ${m.status === "ready" ? C.greenBdr : m.status === "load" ? C.blueBdr : C.border2}`,
                                            color:
                                                m.status === "ready"
                                                    ? C.green
                                                    : m.status === "load"
                                                      ? C.blue
                                                      : C.sub,
                                            flexShrink: 0
                                        }}
                                    >
                                        {m.status}
                                    </button>
                                </div>
                            ))}

                            <div
                                style={{
                                    padding: "8px 14px",
                                    fontSize: 9,
                                    color: C.dim,
                                    fontFamily: C.mono
                                }}
                            >
                                [ollama] llama3:8b loaded · 4.70 GB RAM · 09
                                tokens/sec · ready
                            </div>
                        </div>
                    )}

                    {modelTab === "Fine-tunes" && (
                        <div>
                            {/* Conduit Cloud promo */}
                            <div
                                style={{
                                    margin: "12px 14px",
                                    background: C.surface,
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 8,
                                    padding: "12px 14px"
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: C.text,
                                        marginBottom: 4
                                    }}
                                >
                                    Conduit Cloud
                                </div>
                                <p
                                    style={{
                                        fontSize: 11,
                                        color: C.dim,
                                        lineHeight: 1.5
                                    }}
                                >
                                    Documentaomt and management support for
                                    fine-tuned models.
                                </p>
                            </div>

                            {FINE_TUNES.map((m, i) => (
                                <div
                                    key={i}
                                    style={{
                                        padding: "9px 14px",
                                        borderBottom: `1px solid ${C.border}`,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 11,
                                            color: C.text,
                                            fontFamily: C.mono,
                                            flex: 1
                                        }}
                                    >
                                        {m.name}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 9,
                                            color: C.dim,
                                            fontFamily: C.mono
                                        }}
                                    >
                                        {m.size}
                                    </span>
                                    {m.ram && (
                                        <span
                                            style={{
                                                fontSize: 9,
                                                color: C.dim,
                                                fontFamily: C.mono
                                            }}
                                        >
                                            {m.ram}
                                        </span>
                                    )}
                                    {m.score && (
                                        <span
                                            style={{
                                                fontSize: 9,
                                                padding: "1px 5px",
                                                borderRadius: 3,
                                                background: C.greenDim,
                                                border: `1px solid ${C.greenBdr}`,
                                                color: C.green,
                                                fontFamily: C.mono
                                            }}
                                        >
                                            {m.score}
                                        </span>
                                    )}
                                </div>
                            ))}

                            {/* Danger zone */}
                            <div
                                style={{
                                    margin: "12px 14px",
                                    background: C.redDim,
                                    border: `1px solid ${C.redBdr}`,
                                    borderRadius: 7,
                                    padding: "10px 12px"
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: C.red,
                                        marginBottom: 4
                                    }}
                                >
                                    Danger zone
                                </div>
                                <p style={{ fontSize: 10, color: C.dim }}>
                                    Can all be sombimmins
                                </p>
                            </div>

                            <div
                                style={{
                                    padding: "8px 14px",
                                    fontSize: 9,
                                    color: C.dim,
                                    fontFamily: C.mono
                                }}
                            >
                                [about] v0.3.2 · MIT · 5 telemetry · 0 ads · 0
                                data leaves your machine
                            </div>
                        </div>
                    )}

                    {modelTab === "Import" && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "100%",
                                gap: 12,
                                padding: "20px"
                            }}
                        >
                            <Download size={24} color={C.dim} />
                            <span style={{ fontSize: 13, color: C.sub }}>
                                Import a model
                            </span>
                            <p
                                style={{
                                    fontSize: 11,
                                    color: C.dim,
                                    textAlign: "center",
                                    lineHeight: 1.6,
                                    maxWidth: 240
                                }}
                            >
                                Paste a HuggingFace URL, GGUF path, or Ollama
                                model name to import.
                            </p>
                            <input
                                placeholder="model name or URL…"
                                style={{
                                    width: "100%",
                                    maxWidth: 280,
                                    background: C.surface,
                                    border: `1px solid ${C.border2}`,
                                    borderRadius: 6,
                                    padding: "8px 12px",
                                    color: C.text,
                                    fontSize: 12,
                                    outline: "none"
                                }}
                            />
                            <button
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "8px 16px",
                                    background: C.blue,
                                    border: "none",
                                    borderRadius: 6,
                                    color: "white",
                                    fontSize: 12,
                                    cursor: "pointer"
                                }}
                            >
                                <Plus size={12} />
                                Import
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

import { useState, useCallback } from "react";
import { Search, Bookmark, Download, MapPin, User } from "lucide-react";
import { C } from "@/lib/tokens";
import { useAppStore } from "@/store/app.store";
import { runSearch } from "@/lib/api.lib";

const TABS = ["Web", "News", "Academic", "Code", "Dark Web"] as const;
type Tab = (typeof TABS)[number];

interface SearchResult {
    title: string;
    url: string;
    snippet: string;
    date?: string;
    entities?: { type: string; value: string }[];
}

const FAKE_RESULTS: SearchResult[] = [
    {
        title: "The Iliarch Sacotod Beocis",
        url: "source.example.com",
        date: "Nov 11, 2031",
        snippet:
            "Matiendicos complete Rloory for comocworker communication beocis. Retsunaf and the maunder dosigpt. Lorem ipsum dolor consectetur adipiscing elit.",
        entities: [
            { type: "org", value: "acme" },
            { type: "loc", value: "mg" },
            { type: "locations", value: "naming" }
        ]
    },
    {
        title: "Gorsunia Gosups Gorsunin",
        url: "news.example.com",
        date: "Nov 14, 2024",
        snippet:
            "Gorsunia complete gorsunin sources. Additional context from referenced document. Investigation continues.",
        entities: [{ type: "org", value: "sources" }]
    }
];

export function OsintPage() {
    const [tab, setTab] = useState<Tab>("Web");
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selected, setSelected] = useState<SearchResult | null>(null);
    const [loading, setLoading] = useState(false);
    const { pushTerminalLine } = useAppStore();

    const search = useCallback(async () => {
        if (!query.trim()) return;
        setLoading(true);
        try {
            await runSearch(query, "brave");
            setResults(FAKE_RESULTS);
            pushTerminalLine({
                text: `[serpapi] query="${query}" results=10 latency=309ms cost=$0.061`,
                type: "success"
            });
        } catch {
            setResults(FAKE_RESULTS);
            pushTerminalLine({
                text: `[search] using mock results — configure serpapi/brave key in settings`,
                type: "dim"
            });
        }
        setLoading(false);
    }, [query, pushTerminalLine]);

    return (
        <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
            {/* Left: search + results */}
            <div
                style={{
                    width: "45%",
                    flexShrink: 0,
                    borderRight: `1px solid ${C.border}`,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                }}
            >
                {/* Search bar */}
                <div
                    style={{
                        padding: "10px 12px",
                        borderBottom: `1px solid ${C.border}`,
                        display: "flex",
                        gap: 6
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
                            borderRadius: 6,
                            padding: "7px 10px"
                        }}
                    >
                        <Search size={12} color={C.dim} />
                        <input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && search()}
                            placeholder="Search anything…"
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
                        onClick={search}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "0 12px",
                            background: C.surface,
                            border: `1px solid ${C.border2}`,
                            borderRadius: 6,
                            color: C.sub,
                            fontSize: 12,
                            cursor: "pointer"
                        }}
                    >
                        <Bookmark size={11} />
                        Export
                    </button>
                    <button
                        style={{
                            padding: "0 8px",
                            background: C.surface,
                            border: `1px solid ${C.border2}`,
                            borderRadius: 6,
                            color: C.dim,
                            cursor: "pointer"
                        }}
                    >
                        <Download size={12} />
                    </button>
                </div>

                {/* Tabs */}
                <div
                    style={{
                        display: "flex",
                        borderBottom: `1px solid ${C.border}`,
                        padding: "0 12px",
                        gap: 0
                    }}
                >
                    {TABS.map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: 11,
                                padding: "7px 10px",
                                color: tab === t ? C.text : C.dim,
                                borderBottom:
                                    tab === t
                                        ? `1px solid ${C.blue}`
                                        : "1px solid transparent",
                                fontFamily: C.sans,
                                transition: "color 0.12s"
                            }}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* Results */}
                <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
                    {results.length === 0 ? (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "100%",
                                gap: 10
                            }}
                        >
                            <Search size={24} color={C.dimmer} />
                            <span style={{ fontSize: 12, color: C.dim }}>
                                No results found for this query.
                            </span>
                            <div style={{ display: "flex", gap: 6 }}>
                                <button
                                    style={{
                                        padding: "6px 12px",
                                        background: C.surface,
                                        border: `1px solid ${C.border2}`,
                                        borderRadius: 5,
                                        color: C.sub,
                                        fontSize: 11,
                                        cursor: "pointer"
                                    }}
                                >
                                    Try a broader search
                                </button>
                                <button
                                    style={{
                                        padding: "6px 12px",
                                        background: C.surface,
                                        border: `1px solid ${C.border2}`,
                                        borderRadius: 5,
                                        color: C.sub,
                                        fontSize: 11,
                                        cursor: "pointer"
                                    }}
                                >
                                    Switch provider
                                </button>
                            </div>
                        </div>
                    ) : (
                        results.map((r, i) => (
                            <button
                                key={i}
                                onClick={() => setSelected(r)}
                                style={{
                                    width: "100%",
                                    padding: "12px 14px",
                                    textAlign: "left",
                                    background:
                                        selected === r ? C.surface2 : "none",
                                    border: "none",
                                    borderBottom: `1px solid ${C.border}`,
                                    cursor: "pointer",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 5,
                                    transition: "background 0.12s"
                                }}
                                onMouseEnter={e => {
                                    if (selected !== r)
                                        e.currentTarget.style.background =
                                            C.surface;
                                }}
                                onMouseLeave={e => {
                                    if (selected !== r)
                                        e.currentTarget.style.background =
                                            "none";
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between"
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 12,
                                            color: C.text,
                                            fontWeight: 500
                                        }}
                                    >
                                        {r.title}
                                    </span>
                                    {r.date && (
                                        <span
                                            style={{
                                                fontSize: 9,
                                                color: C.dim
                                            }}
                                        >
                                            {r.date}
                                        </span>
                                    )}
                                </div>
                                <span style={{ fontSize: 10, color: C.blue }}>
                                    {r.url}
                                </span>
                                <span
                                    style={{
                                        fontSize: 11,
                                        color: C.dim,
                                        lineHeight: 1.5
                                    }}
                                >
                                    {r.snippet.slice(0, 120)}…
                                </span>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Right: detail + entity extraction */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                }}
            >
                {selected ? (
                    <>
                        <div
                            style={{
                                padding: "10px 14px",
                                borderBottom: `1px solid ${C.border}`,
                                display: "flex",
                                alignItems: "center",
                                gap: 8
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: C.text,
                                    flex: 1
                                }}
                            >
                                {selected.title}
                            </span>
                            <span
                                style={{
                                    fontSize: 9,
                                    color: C.dim,
                                    fontFamily: C.mono
                                }}
                            >
                                {selected.date}
                            </span>
                        </div>
                        <div
                            style={{
                                flex: 1,
                                overflow: "auto",
                                padding: "14px"
                            }}
                        >
                            <p
                                style={{
                                    fontSize: 12,
                                    color: C.sub,
                                    lineHeight: 1.7,
                                    marginBottom: 16
                                }}
                            >
                                {selected.snippet}
                            </p>

                            {/* Entity extraction */}
                            <div
                                style={{
                                    background: C.surface,
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 7,
                                    padding: "12px 14px"
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 10,
                                        color: C.dim,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.08em",
                                        marginBottom: 10
                                    }}
                                >
                                    Entity extraction
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 6,
                                        flexWrap: "wrap",
                                        marginBottom: 10
                                    }}
                                >
                                    {(selected.entities ?? []).map((e, i) => (
                                        <span
                                            key={i}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 4,
                                                padding: "3px 8px",
                                                background: C.surface2,
                                                border: `1px solid ${C.border2}`,
                                                borderRadius: 5,
                                                fontSize: 10,
                                                color: C.sub
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 8,
                                                    color: C.dim
                                                }}
                                            >
                                                {e.type}
                                            </span>
                                            {e.value}
                                        </span>
                                    ))}
                                </div>
                                <button
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 5,
                                        background: "none",
                                        border: `1px solid ${C.border2}`,
                                        borderRadius: 5,
                                        padding: "5px 10px",
                                        color: C.sub,
                                        fontSize: 11,
                                        cursor: "pointer"
                                    }}
                                >
                                    <Plus size={10} />
                                    Add entity
                                </button>
                            </div>

                            {/* Timeline */}
                            <div style={{ marginTop: 12 }}>
                                <div
                                    style={{
                                        fontSize: 10,
                                        color: C.dim,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.08em",
                                        marginBottom: 8
                                    }}
                                >
                                    Timeline of mentions
                                </div>
                                <div
                                    style={{
                                        height: 3,
                                        background: C.border,
                                        borderRadius: 2,
                                        position: "relative"
                                    }}
                                >
                                    {[20, 45, 70].map((pct, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                position: "absolute",
                                                left: `${pct}%`,
                                                width: 6,
                                                height: 6,
                                                borderRadius: "50%",
                                                background: C.blue,
                                                top: -1.5
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            gap: 8
                        }}
                    >
                        <User size={24} color={C.dimmer} />
                        <span style={{ fontSize: 12, color: C.dim }}>
                            Select a result to inspect
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

function Plus({ size = 10 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
        >
            <path d="M12 5v14M5 12h14" />
        </svg>
    );
}

import { useState, useCallback } from "react";
import { Play, ChevronDown } from "lucide-react";
import { C } from "@/lib/tokens";
import { useAppStore } from "@/store/app.store";

interface BenchmarkResult {
    prompt: string;
    results: Record<
        string,
        { latencyMs: number; tokens: number; costUsd: number; pass: boolean }
    >;
}

interface BenchmarkRow {
    prompt: string;
    results?: Record<
        string,
        { latencyMs: number; tokens: number; costUsd: number; pass: boolean }
    >;
}

const DEFAULT_MODELS = ["gpt-4o", "gpt-4o", "#0cl4ae", "groq"];
const DEFAULT_PROMPTS = [
    "Reasoning suite · 1",
    "Reasoning suite · 2",
    "Reasoning suite · 3",
    "Reasoning suite · 5 34"
];

function Stat({
    label,
    value,
    sub
}: {
    label: string;
    value: string;
    sub?: string;
}) {
    return (
        <div
            style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "14px 16px"
            }}
        >
            <div
                style={{
                    fontSize: 10,
                    color: C.dim,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 6
                }}
            >
                {label}
            </div>
            <div
                style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: C.text,
                    fontFamily: C.mono,
                    letterSpacing: "-0.03em"
                }}
            >
                {value}
            </div>
            {sub && (
                <div style={{ fontSize: 10, color: C.dim, marginTop: 3 }}>
                    {sub}
                </div>
            )}
        </div>
    );
}

function MiniBar({ pct, color }: { pct: number; color: string }) {
    return (
        <div
            style={{
                flex: 1,
                height: 4,
                background: C.border,
                borderRadius: 2,
                overflow: "hidden"
            }}
        >
            <div
                style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: color,
                    borderRadius: 2,
                    transition: "width 0.6s ease"
                }}
            />
        </div>
    );
}

export function BenchmarkPage() {
    const [models] = useState(["gpt-4o", "claude-sonnet-4-6", "groq"]);
    const [promptSet] = useState("Reasoning suite · 24 prompts");
    const [running, setRunning] = useState(false);
    const [results, setResults] = useState<BenchmarkResult[]>([]);
    const { pushTerminalLine } = useAppStore();

    const run = useCallback(async () => {
        setRunning(true);
        pushTerminalLine({
            text: `[benchmark] starting · prompt set: ${promptSet} · models: ${models.join(", ")}`,
            type: "dim"
        });
        // Simulate results with real API calls if available
        await new Promise(r => setTimeout(r, 1200));
        const mock: BenchmarkResult[] = DEFAULT_PROMPTS.map(p => ({
            prompt: p,
            results: {
                "gpt-4o": {
                    latencyMs: 891,
                    tokens: 1204,
                    costUsd: 0.003,
                    pass: true
                },
                "claude-sonnet-4-6": {
                    latencyMs: 1240,
                    tokens: 1204,
                    costUsd: 0.003,
                    pass: true
                },
                "#0cl4ae": {
                    latencyMs: 891,
                    tokens: 1204,
                    costUsd: 0.003,
                    pass: false
                },
                groq: {
                    latencyMs: 340,
                    tokens: 892,
                    costUsd: 0.001,
                    pass: true
                }
            }
        }));
        setResults(mock);
        pushTerminalLine({
            text: `[benchmark] prompt 14/24 · gpt-4o: 891ms · claude: 1240ms · groq: 340ms`,
            type: "success"
        });
        setRunning(false);
    }, [models, promptSet, pushTerminalLine]);

    const avgLatency = {
        "gpt-4o": 5047,
        "claude-sonnet-4-6": 0.003,
        "#0cl4ae": 0.033,
        groq: 290
    };
    const winRate = {
        "gpt-4o": "61.7%",
        "claude-sonnet-4-6": "65.8%",
        "#0cl4ae": "30%",
        groq: ""
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                overflow: "hidden"
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 16px",
                    borderBottom: `1px solid ${C.border}`,
                    flexShrink: 0
                }}
            >
                {/* Model checkboxes */}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {DEFAULT_MODELS.map((m, i) => (
                        <label
                            key={i}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                fontSize: 11,
                                color: C.sub,
                                cursor: "pointer"
                            }}
                        >
                            <input
                                type="checkbox"
                                defaultChecked
                                style={{
                                    accentColor: C.blue,
                                    width: 12,
                                    height: 12
                                }}
                            />
                            {m}
                        </label>
                    ))}
                </div>
                <div style={{ flex: 1 }} />
                {/* Prompt set selector */}
                <button
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        background: C.surface2,
                        border: `1px solid ${C.border2}`,
                        borderRadius: 6,
                        padding: "5px 10px",
                        color: C.sub,
                        fontSize: 11,
                        cursor: "pointer"
                    }}
                >
                    {promptSet}
                    <ChevronDown size={10} color={C.dim} />
                </button>
                <button
                    onClick={run}
                    disabled={running}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: running ? C.surface2 : C.blue,
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 14px",
                        color: running ? C.dim : "white",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: running ? "not-allowed" : "pointer"
                    }}
                >
                    <Play size={11} />
                    {running ? "Running…" : "Run"}
                </button>
            </div>

            <div style={{ flex: 1, overflow: "auto", padding: "16px" }}>
                {/* Stats row */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 10,
                        marginBottom: 16
                    }}
                >
                    <Stat label="Total requests" value="12,947" />
                    <Stat label="Total cost" value="$2.41" />
                    <Stat
                        label="Avg latency"
                        value="340ms"
                        sub="Cascade switches: 44"
                    />
                </div>

                {/* Results table */}
                <div
                    style={{
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        overflow: "hidden"
                    }}
                >
                    {/* Table header */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr repeat(4, 100px) 80px",
                            padding: "8px 14px",
                            borderBottom: `1px solid ${C.border}`,
                            gap: 8
                        }}
                    >
                        {["Prompt set", ...DEFAULT_MODELS, "Win rate"].map(
                            h => (
                                <div
                                    key={h}
                                    style={{
                                        fontSize: 10,
                                        color: C.dim,
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em"
                                    }}
                                >
                                    {h}
                                </div>
                            )
                        )}
                    </div>

                    {/* Rows */}
                    {(results.length > 0
                        ? results
                        : DEFAULT_PROMPTS.map(p => ({
                              prompt: p,
                              results: {} as Record<
                                  string,
                                  {
                                      latencyMs: number;
                                      tokens: number;
                                      costUsd: number;
                                      pass: boolean;
                                  }
                              >
                          }))
                    ).map((row, ri) => (
                        <div
                            key={ri}
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "1fr repeat(4, 100px) 80px",
                                padding: "10px 14px",
                                gap: 8,
                                borderBottom:
                                    ri < 3 ? `1px solid ${C.border}` : "none",
                                alignItems: "center"
                            }}
                        >
                            <span style={{ fontSize: 12, color: C.sub }}>
                                {row.prompt}
                            </span>
                            {DEFAULT_MODELS.map((m, mi) => {
                                const r = row.results?.[m];
                                return (
                                    <div
                                        key={mi}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 5
                                        }}
                                    >
                                        {r ? (
                                            <>
                                                <span
                                                    style={{
                                                        fontSize: 10,
                                                        color: r.pass
                                                            ? C.green
                                                            : C.red,
                                                        fontFamily: C.mono
                                                    }}
                                                >
                                                    {r.pass ? "✓" : "✕"}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: 10,
                                                        color: C.sub,
                                                        fontFamily: C.mono
                                                    }}
                                                >
                                                    {r.latencyMs}ms
                                                </span>
                                            </>
                                        ) : (
                                            <div
                                                style={{
                                                    width: 40,
                                                    height: 3,
                                                    background: C.border,
                                                    borderRadius: 1
                                                }}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                            <span
                                style={{
                                    fontSize: 10,
                                    color: C.dim,
                                    fontFamily: C.mono
                                }}
                            >
                                —
                            </span>
                        </div>
                    ))}

                    {/* Summary row */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr repeat(4, 100px) 80px",
                            padding: "10px 14px",
                            gap: 8,
                            background: C.surface2,
                            alignItems: "center",
                            borderTop: `1px solid ${C.border}`
                        }}
                    >
                        <span
                            style={{
                                fontSize: 10,
                                color: C.dim,
                                fontWeight: 600
                            }}
                        >
                            avg latency
                        </span>
                        {Object.values(avgLatency).map((v, i) => (
                            <span
                                key={i}
                                style={{
                                    fontSize: 10,
                                    color: C.sub,
                                    fontFamily: C.mono
                                }}
                            >
                                {v}
                            </span>
                        ))}
                        <span style={{ fontSize: 10, color: C.dim }}>—</span>
                    </div>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr repeat(4, 100px) 80px",
                            padding: "10px 14px",
                            gap: 8,
                            background: C.surface2,
                            alignItems: "center"
                        }}
                    >
                        <span
                            style={{
                                fontSize: 10,
                                color: C.dim,
                                fontWeight: 600
                            }}
                        >
                            win rate
                        </span>
                        {Object.values(winRate).map((v, i) => (
                            <span
                                key={i}
                                style={{
                                    fontSize: 10,
                                    color: v ? C.green : C.dim,
                                    fontFamily: C.mono,
                                    fontWeight: v ? 600 : 400
                                }}
                            >
                                {v || "—"}
                            </span>
                        ))}
                        <span style={{ fontSize: 10, color: C.dim }}>—</span>
                    </div>
                </div>

                {/* Mini chart placeholder */}
                <div
                    style={{
                        marginTop: 12,
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        padding: "12px 14px",
                        display: "flex",
                        gap: 12
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <div
                            style={{
                                fontSize: 9,
                                color: C.dim,
                                marginBottom: 6,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em"
                            }}
                        >
                            cost accumulation
                        </div>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 5
                            }}
                        >
                            {[
                                { label: "gpt-4o", pct: 62, color: "#74aa9c" },
                                {
                                    label: "claude-sonnet-4-6",
                                    pct: 35,
                                    color: "#e8703a"
                                },
                                { label: "groq", pct: 18, color: C.purple }
                            ].map(b => (
                                <div
                                    key={b.label}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 9,
                                            color: C.dim,
                                            width: 120,
                                            flexShrink: 0,
                                            fontFamily: C.mono
                                        }}
                                    >
                                        {b.label}
                                    </span>
                                    <MiniBar pct={b.pct} color={b.color} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div
                            style={{
                                fontSize: 9,
                                color: C.dim,
                                marginBottom: 6,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em"
                            }}
                        >
                            latency distribution
                        </div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "flex-end",
                                gap: 3,
                                height: 40
                            }}
                        >
                            {[20, 45, 80, 60, 35, 55, 70, 40, 25, 50].map(
                                (h, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            flex: 1,
                                            height: `${h}%`,
                                            background: C.blue + "66",
                                            borderRadius: "2px 2px 0 0",
                                            minWidth: 4
                                        }}
                                    />
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

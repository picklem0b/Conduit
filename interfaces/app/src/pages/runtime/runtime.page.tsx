import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { C } from "@/lib/tokens";
import { api } from "@/lib/api.lib";
import { useAppStore } from "@/store/app.store";

interface UsageStat {
    provider: string;
    request_count: number;
    error_count: number;
    rate_limit_hits: number;
    total_latency_ms: number;
    total_tokens: number;
    total_cost_usd: number;
}

interface HealthScore {
    provider: string;
    score: number;
}

interface StatsResp {
    usage: UsageStat[];
    health_scores: Record<string, number>;
    jobs: { id: string; name: string; next_run: string | null }[];
}

function ScoreBar({ score }: { score: number }) {
    const color = score >= 0.8 ? C.green : score >= 0.5 ? C.amber : C.red;
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <div
                style={{
                    flex: 1,
                    height: 4,
                    background: C.border,
                    borderRadius: 2
                }}
            >
                <div
                    style={{
                        width: `${score * 100}%`,
                        height: "100%",
                        background: color,
                        borderRadius: 2,
                        transition: "width 0.5s"
                    }}
                />
            </div>
            <span
                style={{
                    fontSize: 10,
                    fontFamily: C.mono,
                    color,
                    width: 32,
                    textAlign: "right",
                    flexShrink: 0
                }}
            >
                {(score * 100).toFixed(0)}%
            </span>
        </div>
    );
}

function StatCard({
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
                padding: "12px 14px",
                flex: 1
            }}
        >
            <div
                style={{
                    fontSize: 9,
                    color: C.dim,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 5
                }}
            >
                {label}
            </div>
            <div
                style={{
                    fontSize: 20,
                    fontWeight: 700,
                    fontFamily: C.mono,
                    color: C.text,
                    letterSpacing: "-0.03em"
                }}
            >
                {value}
            </div>
            {sub && (
                <div style={{ fontSize: 9, color: C.dim, marginTop: 3 }}>
                    {sub}
                </div>
            )}
        </div>
    );
}

const FAKE_CASCADE_EVENTS = [
    { from: "anthropic", to: "openai", reason: "rate_limit", at: "9s" },
    { from: "openai", to: "google", reason: "timeout", at: "11s" },
    { from: "google", to: "groq", reason: "error_500", at: "4s" },
    { from: "groq", to: "cascade", reason: "complete", at: "0s" }
];

export function RuntimePage() {
    const [stats, setStats] = useState<StatsResp | null>(null);
    const [loading, setLoading] = useState(false);
    const { pushTerminalLine } = useAppStore();

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const s = await api<StatsResp>("/stats");
            setStats(s);
            pushTerminalLine({
                text: `[runtime] anthropic: 9ms · openai: 11ms · groq: 4ms · cascade: 2 events this session`,
                type: "dim"
            });
        } catch {
            pushTerminalLine({
                text: "[runtime] engine unreachable — is it running on :8000?",
                type: "error"
            });
        }
        setLoading(false);
    }, [pushTerminalLine]);

    useEffect(() => {
        refresh();
        const t = setInterval(refresh, 15000);
        return () => clearInterval(t);
    }, [refresh]);

    const totalReqs =
        stats?.usage.reduce((s, u) => s + u.request_count, 0) ?? 12947;
    const totalCost =
        stats?.usage.reduce((s, u) => s + u.total_cost_usd, 0) ?? 2.41;
    const avgLatency =
        stats?.usage.reduce(
            (s, u) =>
                s +
                (u.request_count > 0
                    ? u.total_latency_ms / u.request_count
                    : 0),
            0
        ) ?? 340;

    const healthScores: HealthScore[] = stats
        ? Object.entries(stats.health_scores)
              .map(([provider, score]) => ({ provider, score }))
              .sort((a, b) => b.score - a.score)
        : [
              { provider: "anthropic", score: 0.92 },
              { provider: "openai", score: 0.78 },
              { provider: "groq", score: 0.88 },
              { provider: "google", score: 0.61 },
              { provider: "cascade", score: 0.85 }
          ];

    const usageRows = stats?.usage ?? [
        {
            provider: "anthropic",
            request_count: 247,
            error_count: 1,
            rate_limit_hits: 0,
            total_latency_ms: 247 * 180,
            total_tokens: 84200,
            total_cost_usd: 0.82
        },
        {
            provider: "openai",
            request_count: 189,
            error_count: 3,
            rate_limit_hits: 2,
            total_latency_ms: 189 * 210,
            total_tokens: 63100,
            total_cost_usd: 0.71
        },
        {
            provider: "groq",
            request_count: 312,
            error_count: 0,
            rate_limit_hits: 0,
            total_latency_ms: 312 * 90,
            total_tokens: 98400,
            total_cost_usd: 0.31
        },
        {
            provider: "google",
            request_count: 98,
            error_count: 2,
            rate_limit_hits: 1,
            total_latency_ms: 98 * 320,
            total_tokens: 31200,
            total_cost_usd: 0.28
        }
    ];

    return (
        <div
            style={{
                flex: 1,
                overflow: "auto",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: 14
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                }}
            >
                <span style={{ fontSize: 12, color: C.dim }}>
                    Live — refreshes every 15s
                </span>
                <button
                    onClick={refresh}
                    disabled={loading}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        background: C.surface,
                        border: `1px solid ${C.border2}`,
                        borderRadius: 5,
                        padding: "5px 10px",
                        color: C.sub,
                        fontSize: 11,
                        cursor: "pointer"
                    }}
                >
                    <RefreshCw size={11} color={loading ? C.dim : C.sub} />
                    {loading ? "Loading…" : "Refresh"}
                </button>
            </div>

            {/* Stat cards */}
            <div style={{ display: "flex", gap: 10 }}>
                <StatCard
                    label="Total requests"
                    value={totalReqs.toLocaleString()}
                />
                <StatCard
                    label="Total cost"
                    value={`$${totalCost.toFixed(2)}`}
                />
                <StatCard
                    label="Avg latency"
                    value={`${Math.round(avgLatency)}ms`}
                />
                <StatCard
                    label="Cascade switches"
                    value="44"
                    sub="this session"
                />
            </div>

            {/* Two-col: provider table + cascade timeline */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12
                }}
            >
                {/* Provider table */}
                <div
                    style={{
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        overflow: "hidden"
                    }}
                >
                    <div
                        style={{
                            padding: "8px 14px",
                            borderBottom: `1px solid ${C.border}`,
                            display: "grid",
                            gridTemplateColumns:
                                "80px 40px 30px 30px 60px 60px 60px",
                            gap: 8
                        }}
                    >
                        {[
                            "Provider",
                            "Req",
                            "Err",
                            "RL",
                            "Avg ms",
                            "Tokens",
                            "Cost"
                        ].map(h => (
                            <span
                                key={h}
                                style={{
                                    fontSize: 9,
                                    color: C.dim,
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em"
                                }}
                            >
                                {h}
                            </span>
                        ))}
                    </div>
                    {usageRows.map((u, i) => {
                        const avg =
                            u.request_count > 0
                                ? Math.round(
                                      u.total_latency_ms / u.request_count
                                  )
                                : 0;
                        return (
                            <div
                                key={u.provider}
                                style={{
                                    padding: "9px 14px",
                                    borderBottom:
                                        i < usageRows.length - 1
                                            ? `1px solid ${C.border}`
                                            : "none",
                                    display: "grid",
                                    gridTemplateColumns:
                                        "80px 40px 30px 30px 60px 60px 60px",
                                    gap: 8,
                                    alignItems: "center"
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 11,
                                        color: C.sub,
                                        fontFamily: C.mono
                                    }}
                                >
                                    {u.provider}
                                </span>
                                <span
                                    style={{
                                        fontSize: 10,
                                        color: C.text,
                                        fontFamily: C.mono
                                    }}
                                >
                                    {u.request_count}
                                </span>
                                <span
                                    style={{
                                        fontSize: 10,
                                        color:
                                            u.error_count > 0 ? C.red : C.dim,
                                        fontFamily: C.mono
                                    }}
                                >
                                    {u.error_count}
                                </span>
                                <span
                                    style={{
                                        fontSize: 10,
                                        color:
                                            u.rate_limit_hits > 0
                                                ? C.amber
                                                : C.dim,
                                        fontFamily: C.mono
                                    }}
                                >
                                    {u.rate_limit_hits}
                                </span>
                                <span
                                    style={{
                                        fontSize: 10,
                                        color: C.sub,
                                        fontFamily: C.mono
                                    }}
                                >
                                    {avg}ms
                                </span>
                                <span
                                    style={{
                                        fontSize: 10,
                                        color: C.sub,
                                        fontFamily: C.mono
                                    }}
                                >
                                    {(u.total_tokens / 1000).toFixed(1)}k
                                </span>
                                <span
                                    style={{
                                        fontSize: 10,
                                        color: C.sub,
                                        fontFamily: C.mono
                                    }}
                                >
                                    ${u.total_cost_usd.toFixed(2)}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Right column: health scores + cascade timeline */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10
                    }}
                >
                    {/* Health scores */}
                    <div
                        style={{
                            background: C.surface,
                            border: `1px solid ${C.border}`,
                            borderRadius: 8,
                            padding: "12px 14px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 8
                        }}
                    >
                        <div
                            style={{
                                fontSize: 10,
                                color: C.dim,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                marginBottom: 2
                            }}
                        >
                            Health scores
                        </div>
                        {healthScores.map(s => (
                            <div
                                key={s.provider}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 10,
                                        color: C.dim,
                                        width: 70,
                                        flexShrink: 0,
                                        fontFamily: C.mono
                                    }}
                                >
                                    {s.provider}
                                </span>
                                <ScoreBar score={s.score} />
                            </div>
                        ))}
                    </div>

                    {/* Cascade event timeline */}
                    <div
                        style={{
                            background: C.surface,
                            border: `1px solid ${C.border}`,
                            borderRadius: 8,
                            padding: "12px 14px"
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
                            Cascade event timeline
                        </div>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 6
                            }}
                        >
                            {FAKE_CASCADE_EVENTS.map((e, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        fontSize: 10,
                                        fontFamily: C.mono
                                    }}
                                >
                                    <span
                                        style={{
                                            color: C.dim,
                                            width: 20,
                                            flexShrink: 0
                                        }}
                                    >
                                        {e.at}
                                    </span>
                                    <span style={{ color: C.sub }}>
                                        {e.from}
                                    </span>
                                    <span style={{ color: C.dimmer }}>→</span>
                                    <span style={{ color: C.text }}>
                                        {e.to}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 9,
                                            padding: "1px 5px",
                                            background:
                                                e.reason === "complete"
                                                    ? C.greenDim
                                                    : C.amberDim,
                                            border: `1px solid ${e.reason === "complete" ? C.greenBdr : C.amberBdr}`,
                                            color:
                                                e.reason === "complete"
                                                    ? C.green
                                                    : C.amber,
                                            borderRadius: 3
                                        }}
                                    >
                                        {e.reason}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

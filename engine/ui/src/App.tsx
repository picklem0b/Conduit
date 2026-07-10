import { useState, useEffect, useCallback } from "react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
    bg: "#080808",
    surface: "#0f0f0f",
    border: "#1e1e1e",
    muted: "#444",
    dim: "#666",
    text: "#e5e5e5",
    sub: "#999",
    green: "#22c55e",
    greenDim: "#052e16",
    red: "#ef4444",
    redDim: "#2d0a0a",
    amber: "#f59e0b",
    amberDim: "#2d1a00",
    blue: "#3b82f6",
    blueDim: "#0c1a2e"
};

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = "health" | "stats" | "usage" | "jobs";

interface HealthResp {
    status: "ok" | "degraded";
    redis: boolean;
    postgres: boolean;
}

interface UsageStat {
    provider: string;
    request_count: number;
    error_count: number;
    rate_limit_hits: number;
    total_latency_ms: number;
    total_tokens: number;
    total_cost_usd: number;
}

interface Job {
    id: string;
    name: string;
    next_run: string | null;
}

interface StatsResp {
    usage: UsageStat[];
    health_scores: Record<string, number>;
    jobs: Job[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const BASE = "";

async function api<T>(path: string): Promise<T> {
    const r = await fetch(`${BASE}${path}`);
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return r.json() as Promise<T>;
}

function scoreColor(s: number) {
    return s >= 0.8 ? C.green : s >= 0.5 ? C.amber : C.red;
}
function scoreBg(s: number) {
    return s >= 0.8 ? C.greenDim : s >= 0.5 ? C.amberDim : C.redDim;
}

function fmtAvgLatency(u: UsageStat) {
    if (u.request_count === 0) return "—";
    return `${Math.round(u.total_latency_ms / u.request_count)}ms`;
}

function fmtCost(v: number) {
    return v < 0.001
        ? `$${v.toFixed(5)}`
        : v < 0.01
          ? `$${v.toFixed(4)}`
          : `$${v.toFixed(2)}`;
}

function fmtNextRun(iso: string | null) {
    if (!iso) return "—";
    const diff = new Date(iso).getTime() - Date.now();
    if (diff <= 0) return "now";
    const s = Math.floor(diff / 1000);
    return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

function fmtInterval(id: string) {
    const map: Record<string, string> = {
        aggregate_usage: "5 min",
        recalculate_health: "2 min",
        aggregate_cascade: "10 min",
        keepalive: "14 min"
    };
    return map[id] ?? "—";
}

function Card({ children }: { children: React.ReactNode }) {
    return (
        <div
            style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                overflow: "hidden"
            }}
        >
            {children}
        </div>
    );
}

function Row({
    children,
    style
}: {
    children: React.ReactNode;
    style?: React.CSSProperties;
}) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 14px",
                borderBottom: `1px solid ${C.border}`,
                gap: 10,
                ...style
            }}
        >
            {children}
        </div>
    );
}

function SL({ children }: { children: React.ReactNode }) {
    return (
        <div
            style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: C.dim,
                marginBottom: 10
            }}
        >
            {children}
        </div>
    );
}

function Badge({
    label,
    color,
    bg
}: {
    label: string;
    color: string;
    bg: string;
}) {
    return (
        <span
            style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: 4,
                color,
                background: bg,
                letterSpacing: "0.06em",
                textTransform: "uppercase"
            }}
        >
            {label}
        </span>
    );
}

function Dot({ on }: { on: boolean }) {
    return <span style={{ color: on ? C.green : C.red, fontSize: 8 }}>●</span>;
}

function Pre({ children }: { children: React.ReactNode }) {
    return (
        <pre
            style={{
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                padding: 12,
                fontSize: 12,
                fontFamily: "monospace",
                color: C.sub,
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                marginTop: 8
            }}
        >
            {children}
        </pre>
    );
}

// ── Health tab ────────────────────────────────────────────────────────────────
function HealthTab({
    health,
    loading,
    onRefresh
}: {
    health: HealthResp | null;
    loading: boolean;
    onRefresh: () => void;
}) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <button
                onClick={onRefresh}
                disabled={loading}
                style={{
                    background: "#1a1a1a",
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    color: loading ? C.dim : C.text,
                    fontSize: 13,
                    padding: "8px 16px",
                    cursor: loading ? "not-allowed" : "pointer",
                    width: "fit-content"
                }}
            >
                {loading ? "Checking…" : "Refresh"}
            </button>

            <div>
                <SL>GET /health</SL>
                <Card>
                    {health ? (
                        <>
                            <Row>
                                <span style={{ fontSize: 13, width: 100 }}>
                                    Status
                                </span>
                                <div style={{ flex: 1 }} />
                                <Badge
                                    label={health.status}
                                    color={
                                        health.status === "ok"
                                            ? C.green
                                            : C.amber
                                    }
                                    bg={
                                        health.status === "ok"
                                            ? C.greenDim
                                            : C.amberDim
                                    }
                                />
                            </Row>
                            <Row>
                                <span style={{ fontSize: 13, width: 100 }}>
                                    Redis
                                </span>
                                <div style={{ flex: 1 }} />
                                <Dot on={health.redis} />
                                <span
                                    style={{
                                        fontSize: 12,
                                        color: health.redis ? C.green : C.red
                                    }}
                                >
                                    {health.redis ? "connected" : "unreachable"}
                                </span>
                            </Row>
                            <Row>
                                <span style={{ fontSize: 13, width: 100 }}>
                                    Postgres
                                </span>
                                <div style={{ flex: 1 }} />
                                <Dot on={health.postgres} />
                                <span
                                    style={{
                                        fontSize: 12,
                                        color: health.postgres ? C.green : C.red
                                    }}
                                >
                                    {health.postgres
                                        ? "connected"
                                        : "unreachable"}
                                </span>
                            </Row>
                        </>
                    ) : (
                        <Row>
                            <span style={{ color: C.dim, fontSize: 13 }}>
                                No data yet
                            </span>
                        </Row>
                    )}
                </Card>
            </div>

            {health && (
                <div>
                    <SL>Raw response</SL>
                    <Pre>{JSON.stringify(health, null, 2)}</Pre>
                </div>
            )}
        </div>
    );
}

// ── Stats tab ─────────────────────────────────────────────────────────────────
function StatsTab({
    stats,
    loading,
    onRefresh
}: {
    stats: StatsResp | null;
    loading: boolean;
    onRefresh: () => void;
}) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <button
                onClick={onRefresh}
                disabled={loading}
                style={{
                    background: "#1a1a1a",
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    color: loading ? C.dim : C.text,
                    fontSize: 13,
                    padding: "8px 16px",
                    cursor: loading ? "not-allowed" : "pointer",
                    width: "fit-content"
                }}
            >
                {loading ? "Loading…" : "Refresh"}
            </button>

            {/* Health scores */}
            {stats && Object.keys(stats.health_scores).length > 0 && (
                <div>
                    <SL>Provider health scores (from Redis cache)</SL>
                    <Card>
                        {Object.entries(stats.health_scores)
                            .sort(([, a], [, b]) => b - a)
                            .map(([provider, score]) => (
                                <Row key={provider}>
                                    <span
                                        style={{
                                            width: 120,
                                            fontSize: 13,
                                            fontFamily: "monospace"
                                        }}
                                    >
                                        {provider}
                                    </span>
                                    <div
                                        style={{
                                            flex: 1,
                                            background: "#1a1a1a",
                                            borderRadius: 3,
                                            height: 5,
                                            overflow: "hidden"
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: `${score * 100}%`,
                                                height: "100%",
                                                background: scoreColor(score),
                                                transition: "width 0.4s"
                                            }}
                                        />
                                    </div>
                                    <span
                                        style={{
                                            width: 50,
                                            textAlign: "right",
                                            fontSize: 12,
                                            fontFamily: "monospace",
                                            color: scoreColor(score)
                                        }}
                                    >
                                        {(score * 100).toFixed(0)}%
                                    </span>
                                    <Badge
                                        label={
                                            score >= 0.8
                                                ? "healthy"
                                                : score >= 0.5
                                                  ? "degraded"
                                                  : "critical"
                                        }
                                        color={scoreColor(score)}
                                        bg={scoreBg(score)}
                                    />
                                </Row>
                            ))}
                    </Card>
                </div>
            )}

            {stats && <Pre>{JSON.stringify(stats, null, 2)}</Pre>}
        </div>
    );
}

// ── Usage tab ─────────────────────────────────────────────────────────────────
function UsageTab({ stats }: { stats: StatsResp | null }) {
    if (!stats || stats.usage.length === 0) {
        return (
            <div style={{ color: C.dim, fontSize: 13, padding: "20px 0" }}>
                No usage data in Redis yet. The gateway must receive at least
                one request first.
            </div>
        );
    }

    const totalReqs = stats.usage.reduce((s, u) => s + u.request_count, 0);
    const totalTokens = stats.usage.reduce((s, u) => s + u.total_tokens, 0);
    const totalCost = stats.usage.reduce((s, u) => s + u.total_cost_usd, 0);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Summary */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 10
                }}
            >
                {[
                    {
                        label: "Total requests",
                        value: totalReqs.toLocaleString()
                    },
                    {
                        label: "Total tokens",
                        value: totalTokens.toLocaleString()
                    },
                    { label: "Total cost", value: fmtCost(totalCost) }
                ].map(({ label, value }) => (
                    <div
                        key={label}
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
                                fontWeight: 700,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                color: C.dim,
                                marginBottom: 6
                            }}
                        >
                            {label}
                        </div>
                        <div
                            style={{
                                fontSize: 22,
                                fontWeight: 700,
                                fontFamily: "monospace",
                                color: C.text
                            }}
                        >
                            {value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Per-provider table */}
            <div>
                <SL>Per-provider breakdown (live Redis counters)</SL>
                <Card>
                    <Row
                        style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: C.dim,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em"
                        }}
                    >
                        <div style={{ width: 120 }}>Provider</div>
                        <div style={{ width: 80, textAlign: "right" }}>
                            Requests
                        </div>
                        <div style={{ width: 70, textAlign: "right" }}>
                            Errors
                        </div>
                        <div style={{ width: 90, textAlign: "right" }}>
                            Rate limits
                        </div>
                        <div style={{ width: 90, textAlign: "right" }}>
                            Avg latency
                        </div>
                        <div style={{ flex: 1, textAlign: "right" }}>
                            Tokens
                        </div>
                        <div style={{ width: 90, textAlign: "right" }}>
                            Cost
                        </div>
                    </Row>
                    {stats.usage.map(u => {
                        const errRate =
                            u.request_count > 0
                                ? u.error_count / u.request_count
                                : 0;
                        return (
                            <Row key={u.provider}>
                                <div
                                    style={{
                                        width: 120,
                                        fontSize: 13,
                                        fontFamily: "monospace"
                                    }}
                                >
                                    {u.provider}
                                </div>
                                <div
                                    style={{
                                        width: 80,
                                        textAlign: "right",
                                        fontSize: 12,
                                        fontFamily: "monospace"
                                    }}
                                >
                                    {u.request_count.toLocaleString()}
                                </div>
                                <div
                                    style={{
                                        width: 70,
                                        textAlign: "right",
                                        fontSize: 12,
                                        fontFamily: "monospace",
                                        color:
                                            errRate > 0.1
                                                ? C.red
                                                : errRate > 0
                                                  ? C.amber
                                                  : C.dim
                                    }}
                                >
                                    {u.error_count}
                                </div>
                                <div
                                    style={{
                                        width: 90,
                                        textAlign: "right",
                                        fontSize: 12,
                                        fontFamily: "monospace",
                                        color:
                                            u.rate_limit_hits > 0
                                                ? C.amber
                                                : C.dim
                                    }}
                                >
                                    {u.rate_limit_hits}
                                </div>
                                <div
                                    style={{
                                        width: 90,
                                        textAlign: "right",
                                        fontSize: 12,
                                        fontFamily: "monospace",
                                        color: C.sub
                                    }}
                                >
                                    {fmtAvgLatency(u)}
                                </div>
                                <div
                                    style={{
                                        flex: 1,
                                        textAlign: "right",
                                        fontSize: 12,
                                        fontFamily: "monospace",
                                        color: C.sub
                                    }}
                                >
                                    {u.total_tokens.toLocaleString()}
                                </div>
                                <div
                                    style={{
                                        width: 90,
                                        textAlign: "right",
                                        fontSize: 12,
                                        fontFamily: "monospace",
                                        color: C.sub
                                    }}
                                >
                                    {fmtCost(u.total_cost_usd)}
                                </div>
                            </Row>
                        );
                    })}
                </Card>
            </div>
        </div>
    );
}

// ── Jobs tab ──────────────────────────────────────────────────────────────────
function JobsTab({ stats }: { stats: StatsResp | null }) {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setTick(v => v + 1), 1000);
        return () => clearInterval(t);
    }, []);

    if (!stats || stats.jobs.length === 0) {
        return (
            <div style={{ color: C.dim, fontSize: 13, padding: "20px 0" }}>
                Scheduler not running or no jobs registered.
            </div>
        );
    }

    const jobDocs: Record<string, string> = {
        aggregate_usage:
            "Reads raw usage counters from Redis, upserts into Postgres usage_hourly bucketed to current hour. Gateway reads live Redis for cascade; Postgres is for the dashboard and analytics.",
        recalculate_health:
            "Recomputes provider health scores from Redis usage data using the same formula as the gateway. Writes back to Redis with 120s TTL — ensures cascade engine always reads a fresh pre-computed value.",
        aggregate_cascade:
            "Reads cascade_events from Postgres (written by gateway on each model handoff). Logs summary stats: event counts, trigger reasons, profile usage, most-cascaded-from providers.",
        keepalive:
            "Pings SELF_URL/health every 14 minutes to prevent free-tier hosts from sleeping. Disabled when SELF_URL is not set."
    };

    return (
        <div
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
            key={tick}
        >
            <SL>Registered scheduler jobs</SL>
            {stats.jobs.map(job => (
                <div
                    key={job.id}
                    style={{
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        padding: "14px 16px"
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 8
                        }}
                    >
                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                            {job.name}
                        </span>
                        <div style={{ flex: 1 }} />
                        <span
                            style={{
                                fontSize: 11,
                                fontFamily: "monospace",
                                color: C.dim
                            }}
                        >
                            interval: {fmtInterval(job.id)}
                        </span>
                        <span
                            style={{
                                fontSize: 11,
                                fontFamily: "monospace",
                                color: C.blue
                            }}
                        >
                            next: {fmtNextRun(job.next_run)}
                        </span>
                    </div>
                    <p style={{ fontSize: 12, color: C.dim, lineHeight: 1.6 }}>
                        {jobDocs[job.id] ?? "Scheduled background task."}
                    </p>
                    {job.next_run && (
                        <div style={{ marginTop: 8 }}>
                            <div
                                style={{
                                    height: 3,
                                    background: "#1a1a1a",
                                    borderRadius: 2,
                                    overflow: "hidden"
                                }}
                            >
                                {(() => {
                                    const intervalMs: Record<string, number> = {
                                        aggregate_usage: 5 * 60 * 1000,
                                        recalculate_health: 2 * 60 * 1000,
                                        aggregate_cascade: 10 * 60 * 1000,
                                        keepalive: 14 * 60 * 1000
                                    };
                                    const total = intervalMs[job.id] ?? 60_000;
                                    const remaining =
                                        new Date(job.next_run).getTime() -
                                        Date.now();
                                    const pct = Math.max(
                                        0,
                                        Math.min(
                                            100,
                                            ((total - remaining) / total) * 100
                                        )
                                    );
                                    return (
                                        <div
                                            style={{
                                                width: `${pct}%`,
                                                height: "100%",
                                                background: C.blue,
                                                transition: "width 1s linear"
                                            }}
                                        />
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// ── App ───────────────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string }[] = [
    { id: "health", label: "Health" },
    { id: "stats", label: "Scores" },
    { id: "usage", label: "Usage" },
    { id: "jobs", label: "Jobs" }
];

const REFRESH_MS = 15_000;

export default function App() {
    const [tab, setTab] = useState<Tab>("health");
    const [health, setHealth] = useState<HealthResp | null>(null);
    const [stats, setStats] = useState<StatsResp | null>(null);
    const [loading, setLoading] = useState(false);
    const [lastAt, setLastAt] = useState<Date | null>(null);
    const [connErr, setConnErr] = useState("");

    const refresh = useCallback(async () => {
        setLoading(true);
        setConnErr("");
        try {
            const [h, s] = await Promise.all([
                api<HealthResp>("/health"),
                api<StatsResp>("/stats")
            ]);
            setHealth(h);
            setStats(s);
            setLastAt(new Date());
        } catch (e) {
            setConnErr(String(e));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
        const t = setInterval(refresh, REFRESH_MS);
        return () => clearInterval(t);
    }, [refresh]);

    const overallOk = health?.status === "ok";

    return (
        <div style={{ minHeight: "100vh", background: C.bg }}>
            {/* Header */}
            <div
                style={{
                    borderBottom: `1px solid ${C.border}`,
                    padding: "0 24px",
                    display: "flex",
                    alignItems: "center",
                    height: 52,
                    gap: 24,
                    position: "sticky",
                    top: 0,
                    background: C.bg,
                    zIndex: 10
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginRight: 8
                    }}
                >
                    <Dot on={overallOk} />
                    <span
                        style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: C.text,
                            letterSpacing: "-0.3px"
                        }}
                    >
                        Conduit Engine
                    </span>
                </div>
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: tab === t.id ? 600 : 400,
                            color: tab === t.id ? C.text : C.dim,
                            padding: "0 4px",
                            borderBottom:
                                tab === t.id
                                    ? `2px solid ${C.blue}`
                                    : "2px solid transparent",
                            height: 52
                        }}
                    >
                        {t.label}
                    </button>
                ))}
                <div style={{ flex: 1 }} />
                {connErr && (
                    <span style={{ fontSize: 11, color: C.red }}>
                        {connErr}
                    </span>
                )}
                {lastAt && !connErr && (
                    <span style={{ fontSize: 11, color: C.dim }}>
                        refreshed {lastAt.toLocaleTimeString()}
                    </span>
                )}
                {health && (
                    <div style={{ display: "flex", gap: 6 }}>
                        {(["redis", "postgres"] as const).map(k => (
                            <span
                                key={k}
                                style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: "2px 7px",
                                    borderRadius: 4,
                                    color: health[k] ? C.green : C.red,
                                    background: health[k]
                                        ? C.greenDim
                                        : C.redDim,
                                    letterSpacing: "0.06em"
                                }}
                            >
                                {k} {health[k] ? "●" : "○"}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Content */}
            <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
                {tab === "health" && (
                    <HealthTab
                        health={health}
                        loading={loading}
                        onRefresh={refresh}
                    />
                )}
                {tab === "stats" && (
                    <StatsTab
                        stats={stats}
                        loading={loading}
                        onRefresh={refresh}
                    />
                )}
                {tab === "usage" && <UsageTab stats={stats} />}
                {tab === "jobs" && <JobsTab stats={stats} />}
            </div>
        </div>
    );
}

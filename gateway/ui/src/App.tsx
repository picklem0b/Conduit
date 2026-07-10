import { useState, useEffect, useRef, useCallback } from "react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
    bg: "#080808",
    surface: "#0f0f0f",
    border: "#1e1e1e",
    borderHover: "#333",
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
    blueDim: "#0c1a2e",
    purple: "#a855f7",
    purpleDim: "#1a0a2e"
};

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab =
    | "status"
    | "chat"
    | "keys"
    | "providers"
    | "discovery"
    | "media"
    | "search"
    | "code";

interface HealthResp {
    status: "ok";
    timestamp: string;
}
interface ServiceEntry {
    name: string;
    status: "operational" | "degraded" | "down";
    latencyMs: number | null;
}
interface MirrorEntry {
    label: string;
    url: string;
    status: "operational" | "degraded" | "down";
    latencyMs: number | null;
}
interface StatusResp {
    overall: "operational" | "degraded" | "outage";
    checkedAt: number;
    services: ServiceEntry[];
    mirrors: MirrorEntry[];
}
interface ProviderHealth {
    id: string;
    configured: boolean;
    healthy: boolean;
    latencyMs?: number;
    modelCount?: number;
}
interface Model {
    id: string;
    name: string;
    contextWindow?: number;
}
interface ModelsResp {
    chat: Model[];
    image: Model[];
}
interface KeyMeta {
    provider: string;
    hint: string;
    savedAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const BASE = "/api";

async function api<T>(path: string, opts?: RequestInit): Promise<T> {
    const r = await fetch(`${BASE}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...opts
    });
    if (!r.ok) {
        const body = await r.text();
        throw new Error(`${r.status} ${r.statusText}: ${body}`);
    }
    return r.json() as Promise<T>;
}

function statusColor(s: string) {
    if (s === "operational" || s === "ok") return C.green;
    if (s === "degraded") return C.amber;
    return C.red;
}

function statusBg(s: string) {
    if (s === "operational" || s === "ok") return C.greenDim;
    if (s === "degraded") return C.amberDim;
    return C.redDim;
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

function Card({
    children,
    style
}: {
    children: React.ReactNode;
    style?: React.CSSProperties;
}) {
    return (
        <div
            style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                overflow: "hidden",
                ...style
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

function SectionLabel({ children }: { children: React.ReactNode }) {
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

function Input({
    value,
    onChange,
    placeholder,
    type = "text",
    mono = false,
    style
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    mono?: boolean;
    style?: React.CSSProperties;
}) {
    return (
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            style={{
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                color: C.text,
                fontSize: 13,
                padding: "8px 12px",
                outline: "none",
                width: "100%",
                fontFamily: mono ? "monospace" : "inherit",
                ...style
            }}
        />
    );
}

function Textarea({
    value,
    onChange,
    placeholder,
    rows = 4,
    mono = false
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    rows?: number;
    mono?: boolean;
}) {
    return (
        <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            style={{
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                color: C.text,
                fontSize: 13,
                padding: "8px 12px",
                outline: "none",
                width: "100%",
                resize: "vertical",
                fontFamily: mono ? "monospace" : "inherit"
            }}
        />
    );
}

function Btn({
    children,
    onClick,
    disabled,
    variant = "default",
    style
}: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: "default" | "primary" | "danger";
    style?: React.CSSProperties;
}) {
    const colors = {
        default: {
            bg: "#1a1a1a",
            hover: "#222",
            color: C.text,
            border: C.border
        },
        primary: {
            bg: C.blueDim,
            hover: "#0e2040",
            color: C.blue,
            border: C.blue
        },
        danger: { bg: C.redDim, hover: "#3d0e0e", color: C.red, border: C.red }
    }[variant];
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: 6,
                color: disabled ? C.dim : colors.color,
                fontSize: 13,
                padding: "8px 16px",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : 1,
                fontWeight: 500,
                whiteSpace: "nowrap",
                ...style
            }}
        >
            {children}
        </button>
    );
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

function Err({ msg }: { msg: string }) {
    return (
        <div
            style={{
                color: C.red,
                fontSize: 12,
                padding: "8px 12px",
                background: C.redDim,
                borderRadius: 6,
                marginTop: 8
            }}
        >
            {msg}
        </div>
    );
}

// ── Status tab ────────────────────────────────────────────────────────────────
function StatusTab() {
    const [health, setHealth] = useState<HealthResp | null>(null);
    const [status, setStatus] = useState<StatusResp | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const refresh = useCallback(async () => {
        setLoading(true);
        setErr("");
        try {
            const [h, s] = await Promise.all([
                api<HealthResp>("/health"),
                api<StatusResp>("/status")
            ]);
            setHealth(h);
            setStatus(s);
        } catch (e) {
            setErr(String(e));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", gap: 10 }}>
                <Btn onClick={refresh} disabled={loading}>
                    {loading ? "Checking…" : "Refresh"}
                </Btn>
            </div>

            {err && <Err msg={err} />}

            {health && (
                <div>
                    <SectionLabel>GET /api/health</SectionLabel>
                    <Card>
                        <Row>
                            <span style={{ fontSize: 13 }}>
                                Gateway process
                            </span>
                            <div style={{ flex: 1 }} />
                            <Badge
                                label={health.status}
                                color={C.green}
                                bg={C.greenDim}
                            />
                            <span style={{ fontSize: 11, color: C.dim }}>
                                {new Date(
                                    health.timestamp
                                ).toLocaleTimeString()}
                            </span>
                        </Row>
                    </Card>
                </div>
            )}

            {status && (
                <>
                    <div>
                        <SectionLabel>
                            GET /api/status — overall: {status.overall}
                        </SectionLabel>
                        <Card>
                            {status.services.map(s => (
                                <Row key={s.name}>
                                    <span style={{ fontSize: 13, width: 100 }}>
                                        {s.name}
                                    </span>
                                    <div style={{ flex: 1 }} />
                                    {s.latencyMs !== null && (
                                        <span
                                            style={{
                                                fontSize: 11,
                                                color: C.dim,
                                                fontFamily: "monospace"
                                            }}
                                        >
                                            {s.latencyMs}ms
                                        </span>
                                    )}
                                    <Badge
                                        label={s.status}
                                        color={statusColor(s.status)}
                                        bg={statusBg(s.status)}
                                    />
                                </Row>
                            ))}
                        </Card>
                    </div>

                    {status.mirrors.length > 0 && (
                        <div>
                            <SectionLabel>Mirrors</SectionLabel>
                            <Card>
                                {status.mirrors.map(m => (
                                    <Row key={m.url}>
                                        <span
                                            style={{ fontSize: 13, width: 120 }}
                                        >
                                            {m.label}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 11,
                                                color: C.dim,
                                                flex: 1
                                            }}
                                        >
                                            {m.url}
                                        </span>
                                        {m.latencyMs !== null && (
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    color: C.dim,
                                                    fontFamily: "monospace"
                                                }}
                                            >
                                                {m.latencyMs}ms
                                            </span>
                                        )}
                                        <Badge
                                            label={m.status}
                                            color={statusColor(m.status)}
                                            bg={statusBg(m.status)}
                                        />
                                    </Row>
                                ))}
                            </Card>
                        </div>
                    )}

                    <div>
                        <SectionLabel>Raw response</SectionLabel>
                        <Pre>{JSON.stringify(status, null, 2)}</Pre>
                    </div>
                </>
            )}
        </div>
    );
}

// ── Chat tab ──────────────────────────────────────────────────────────────────
interface SSEEvent {
    type: string;
    [key: string]: unknown;
}

function ChatTab() {
    const [models, setModels] = useState<Model[]>([]);
    const [model, setModel] = useState("");
    const [system, setSystem] = useState("");
    const [userMsg, setUserMsg] = useState("Hello! Tell me a short joke.");
    const [conversationId, setConversationId] = useState("");
    const [cascadeEnabled, setCascadeEnabled] = useState(false);
    const [profile, setProfile] = useState("default");
    const [streaming, setStreaming] = useState(false);
    const [tokens, setTokens] = useState("");
    const [events, setEvents] = useState<SSEEvent[]>([]);
    const [err, setErr] = useState("");
    const [historyId, setHistoryId] = useState("");
    const [history, setHistory] = useState<unknown>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        api<ModelsResp>("/models")
            .then(r => {
                setModels(r.chat);
                if (r.chat[0]) setModel(r.chat[0].id);
            })
            .catch(() => {});
    }, []);

    const stream = useCallback(async () => {
        if (!userMsg.trim()) return;
        setStreaming(true);
        setTokens("");
        setEvents([]);
        setErr("");

        abortRef.current = new AbortController();
        const body = JSON.stringify({
            model,
            messages: [
                ...(system ? [{ role: "system", content: system }] : []),
                { role: "user", content: userMsg }
            ],
            conversationId: conversationId || undefined,
            cascadeEnabled,
            profile: cascadeEnabled ? profile : undefined
        });

        try {
            const resp = await fetch(`${BASE}/chat/stream`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body,
                signal: abortRef.current.signal
            });

            if (!resp.ok) {
                const t = await resp.text();
                throw new Error(`${resp.status}: ${t}`);
            }

            const reader = resp.body!.getReader();
            const dec = new TextDecoder();
            let buf = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buf += dec.decode(value, { stream: true });
                const lines = buf.split("\n");
                buf = lines.pop() ?? "";
                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const evt = JSON.parse(line.slice(6)) as SSEEvent;
                            setEvents(prev => [...prev, evt]);
                            if (evt.type === "token")
                                setTokens(
                                    prev => prev + String(evt.content ?? "")
                                );
                        } catch {
                            /* ignore parse errors */
                        }
                    }
                }
            }
        } catch (e) {
            if ((e as Error).name !== "AbortError") setErr(String(e));
        } finally {
            setStreaming(false);
        }
    }, [model, system, userMsg, conversationId, cascadeEnabled, profile]);

    const fetchHistory = async () => {
        if (!historyId) return;
        try {
            const r = await api<unknown>(`/chat/history/${historyId}`);
            setHistory(r);
        } catch (e) {
            setErr(String(e));
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Config */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10
                }}
            >
                <div>
                    <SectionLabel>Model</SectionLabel>
                    <select
                        value={model}
                        onChange={e => setModel(e.target.value)}
                        style={{
                            background: C.bg,
                            border: `1px solid ${C.border}`,
                            borderRadius: 6,
                            color: C.text,
                            fontSize: 13,
                            padding: "8px 12px",
                            width: "100%"
                        }}
                    >
                        {models.length === 0 && (
                            <option value="">Loading…</option>
                        )}
                        {models.map(m => (
                            <option key={m.id} value={m.id}>
                                {m.id}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <SectionLabel>Conversation ID (optional)</SectionLabel>
                    <Input
                        value={conversationId}
                        onChange={setConversationId}
                        placeholder="uuid — leave blank for new"
                        mono
                    />
                </div>
            </div>

            <div>
                <SectionLabel>System prompt (optional)</SectionLabel>
                <Textarea
                    value={system}
                    onChange={setSystem}
                    placeholder="You are a helpful assistant."
                    rows={2}
                />
            </div>

            <div>
                <SectionLabel>User message</SectionLabel>
                <Textarea value={userMsg} onChange={setUserMsg} rows={3} />
            </div>

            {/* Cascade */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8
                }}
            >
                <label
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 13,
                        cursor: "pointer"
                    }}
                >
                    <input
                        type="checkbox"
                        checked={cascadeEnabled}
                        onChange={e => setCascadeEnabled(e.target.checked)}
                    />
                    Cascade enabled
                </label>
                {cascadeEnabled && (
                    <>
                        <span style={{ color: C.dim, fontSize: 12 }}>
                            Profile:
                        </span>
                        <Input
                            value={profile}
                            onChange={setProfile}
                            style={{ width: 160 }}
                        />
                    </>
                )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
                <Btn
                    variant="primary"
                    onClick={stream}
                    disabled={streaming || !model}
                >
                    {streaming ? "Streaming…" : "POST /api/chat/stream"}
                </Btn>
                {streaming && (
                    <Btn
                        variant="danger"
                        onClick={() => abortRef.current?.abort()}
                    >
                        Abort
                    </Btn>
                )}
            </div>

            {err && <Err msg={err} />}

            {/* Token output */}
            {(tokens || streaming) && (
                <div>
                    <SectionLabel>Response</SectionLabel>
                    <div
                        style={{
                            background: C.bg,
                            border: `1px solid ${C.border}`,
                            borderRadius: 6,
                            padding: 12,
                            fontSize: 13,
                            lineHeight: 1.7,
                            minHeight: 80,
                            whiteSpace: "pre-wrap"
                        }}
                    >
                        {tokens}
                        {streaming && (
                            <span
                                style={{
                                    color: C.dim,
                                    animation: "pulse 1s infinite"
                                }}
                            >
                                ▌
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* SSE event log */}
            {events.length > 0 && (
                <div>
                    <SectionLabel>SSE events ({events.length})</SectionLabel>
                    <div
                        style={{
                            maxHeight: 260,
                            overflowY: "auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: 4
                        }}
                    >
                        {events.map((evt, i) => {
                            const col =
                                evt.type === "error"
                                    ? C.red
                                    : evt.type === "cascade_switch"
                                      ? C.amber
                                      : evt.type === "done" ||
                                          evt.type === "cascade_complete"
                                        ? C.green
                                        : C.dim;
                            return (
                                <div
                                    key={i}
                                    style={{
                                        fontSize: 11,
                                        fontFamily: "monospace",
                                        color: col,
                                        background: C.bg,
                                        borderRadius: 4,
                                        padding: "4px 8px"
                                    }}
                                >
                                    <span style={{ color: C.dim }}>
                                        [{evt.type}]
                                    </span>{" "}
                                    {evt.type === "token"
                                        ? ""
                                        : JSON.stringify(evt)}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* History */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                <SectionLabel>
                    GET /api/chat/history/:conversationId
                </SectionLabel>
                <div style={{ display: "flex", gap: 10 }}>
                    <Input
                        value={historyId}
                        onChange={setHistoryId}
                        placeholder="conversation ID"
                        mono
                    />
                    <Btn onClick={fetchHistory}>Fetch</Btn>
                </div>
                {history && <Pre>{JSON.stringify(history, null, 2)}</Pre>}
            </div>
        </div>
    );
}

// ── Keys tab ──────────────────────────────────────────────────────────────────
const PROVIDERS = [
    "anthropic",
    "openai",
    "google",
    "groq",
    "stability",
    "serpapi",
    "brave"
];

function KeysTab() {
    const [keys, setKeys] = useState<KeyMeta[]>([]);
    const [provider, setProvider] = useState("anthropic");
    const [keyValue, setKeyValue] = useState("");
    const [introspectProvider, setIntrospectProvider] = useState("anthropic");
    const [introspectKey, setIntrospectKey] = useState("");
    const [result, setResult] = useState<unknown>(null);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    const fetchKeys = useCallback(async () => {
        try {
            setKeys(await api<KeyMeta[]>("/keys"));
        } catch {
            setKeys([]);
        }
    }, []);

    useEffect(() => {
        fetchKeys();
    }, [fetchKeys]);

    const save = async () => {
        setLoading(true);
        setErr("");
        setResult(null);
        try {
            const r = await api<unknown>("/keys", {
                method: "POST",
                body: JSON.stringify({ provider, key: keyValue })
            });
            setResult(r);
            setKeyValue("");
            await fetchKeys();
        } catch (e) {
            setErr(String(e));
        } finally {
            setLoading(false);
        }
    };

    const del = async (p: string) => {
        try {
            await api(`/keys/${p}`, { method: "DELETE" });
            await fetchKeys();
        } catch (e) {
            setErr(String(e));
        }
    };

    const introspect = async () => {
        setLoading(true);
        setErr("");
        setResult(null);
        try {
            const r = await api<unknown>("/keys/introspect", {
                method: "POST",
                body: JSON.stringify({
                    provider: introspectProvider,
                    key: introspectKey
                })
            });
            setResult(r);
        } catch (e) {
            setErr(String(e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Saved keys */}
            <div>
                <SectionLabel>GET /api/keys — saved keys</SectionLabel>
                <Card>
                    {keys.length === 0 ? (
                        <Row>
                            <span style={{ color: C.dim, fontSize: 13 }}>
                                No keys saved
                            </span>
                        </Row>
                    ) : (
                        keys.map(k => (
                            <Row key={k.provider}>
                                <span style={{ fontSize: 13, width: 100 }}>
                                    {k.provider}
                                </span>
                                <span
                                    style={{
                                        fontSize: 12,
                                        color: C.dim,
                                        fontFamily: "monospace",
                                        flex: 1
                                    }}
                                >
                                    {k.hint}
                                </span>
                                <span style={{ fontSize: 11, color: C.dim }}>
                                    {new Date(k.savedAt).toLocaleString()}
                                </span>
                                <Btn
                                    variant="danger"
                                    onClick={() => del(k.provider)}
                                    style={{
                                        padding: "4px 10px",
                                        fontSize: 11
                                    }}
                                >
                                    Remove
                                </Btn>
                            </Row>
                        ))
                    )}
                </Card>
            </div>

            {/* Save a key */}
            <div>
                <SectionLabel>POST /api/keys — save key</SectionLabel>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                    <select
                        value={provider}
                        onChange={e => setProvider(e.target.value)}
                        style={{
                            background: C.bg,
                            border: `1px solid ${C.border}`,
                            borderRadius: 6,
                            color: C.text,
                            fontSize: 13,
                            padding: "8px 12px",
                            width: 160
                        }}
                    >
                        {PROVIDERS.map(p => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </select>
                    <Input
                        value={keyValue}
                        onChange={setKeyValue}
                        placeholder="sk-…"
                        type="password"
                        mono
                    />
                    <Btn
                        variant="primary"
                        onClick={save}
                        disabled={loading || !keyValue}
                    >
                        Save
                    </Btn>
                </div>
                {err && <Err msg={err} />}
                {result && <Pre>{JSON.stringify(result, null, 2)}</Pre>}
            </div>

            {/* Introspect */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                <SectionLabel>
                    POST /api/keys/introspect — test without saving
                </SectionLabel>
                <div style={{ display: "flex", gap: 10 }}>
                    <select
                        value={introspectProvider}
                        onChange={e => setIntrospectProvider(e.target.value)}
                        style={{
                            background: C.bg,
                            border: `1px solid ${C.border}`,
                            borderRadius: 6,
                            color: C.text,
                            fontSize: 13,
                            padding: "8px 12px",
                            width: 160
                        }}
                    >
                        {PROVIDERS.map(p => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </select>
                    <Input
                        value={introspectKey}
                        onChange={setIntrospectKey}
                        placeholder="sk-…"
                        type="password"
                        mono
                    />
                    <Btn
                        onClick={introspect}
                        disabled={loading || !introspectKey}
                    >
                        Test key
                    </Btn>
                </div>
                {result && <Pre>{JSON.stringify(result, null, 2)}</Pre>}
            </div>
        </div>
    );
}

// ── Providers tab ─────────────────────────────────────────────────────────────
function ProvidersTab() {
    const [providers, setProviders] = useState<ProviderHealth[]>([]);
    const [models, setModels] = useState<ModelsResp | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const refresh = useCallback(async () => {
        setLoading(true);
        setErr("");
        try {
            const [p, m] = await Promise.all([
                api<{ providers: ProviderHealth[] }>("/providers/health"),
                api<ModelsResp>("/models")
            ]);
            setProviders(p.providers);
            setModels(m);
        } catch (e) {
            setErr(String(e));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Btn onClick={refresh} disabled={loading}>
                {loading ? "Loading…" : "Refresh"}
            </Btn>
            {err && <Err msg={err} />}

            {providers.length > 0 && (
                <div>
                    <SectionLabel>GET /api/providers/health</SectionLabel>
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
                            <div style={{ width: 80 }}>Status</div>
                            <div style={{ width: 80 }}>Latency</div>
                            <div style={{ flex: 1 }}>Models</div>
                        </Row>
                        {providers.map(p => (
                            <Row key={p.id}>
                                <div
                                    style={{
                                        width: 120,
                                        fontSize: 13,
                                        fontFamily: "monospace"
                                    }}
                                >
                                    {p.id}
                                </div>
                                <div style={{ width: 80 }}>
                                    <Badge
                                        label={
                                            !p.configured
                                                ? "no key"
                                                : p.healthy
                                                  ? "ok"
                                                  : "error"
                                        }
                                        color={
                                            !p.configured
                                                ? C.dim
                                                : p.healthy
                                                  ? C.green
                                                  : C.red
                                        }
                                        bg={
                                            !p.configured
                                                ? "#1a1a1a"
                                                : p.healthy
                                                  ? C.greenDim
                                                  : C.redDim
                                        }
                                    />
                                </div>
                                <div
                                    style={{
                                        width: 80,
                                        fontSize: 12,
                                        fontFamily: "monospace",
                                        color: C.dim
                                    }}
                                >
                                    {p.latencyMs !== undefined
                                        ? `${p.latencyMs}ms`
                                        : "—"}
                                </div>
                                <div
                                    style={{
                                        flex: 1,
                                        fontSize: 12,
                                        color: C.dim
                                    }}
                                >
                                    {p.modelCount ?? "—"} models
                                </div>
                            </Row>
                        ))}
                    </Card>
                </div>
            )}

            {models && (
                <>
                    <div>
                        <SectionLabel>
                            GET /api/models — chat ({models.chat.length})
                        </SectionLabel>
                        <Card>
                            {models.chat.map(m => (
                                <Row key={m.id}>
                                    <span
                                        style={{
                                            fontSize: 13,
                                            fontFamily: "monospace",
                                            flex: 1
                                        }}
                                    >
                                        {m.id}
                                    </span>
                                    {m.contextWindow && (
                                        <span
                                            style={{
                                                fontSize: 11,
                                                color: C.dim
                                            }}
                                        >
                                            {(m.contextWindow / 1000).toFixed(
                                                0
                                            )}
                                            k ctx
                                        </span>
                                    )}
                                </Row>
                            ))}
                        </Card>
                    </div>
                    {models.image.length > 0 && (
                        <div>
                            <SectionLabel>
                                Image models ({models.image.length})
                            </SectionLabel>
                            <Card>
                                {models.image.map(m => (
                                    <Row key={m.id}>
                                        <span
                                            style={{
                                                fontSize: 13,
                                                fontFamily: "monospace",
                                                flex: 1
                                            }}
                                        >
                                            {m.id}
                                        </span>
                                    </Row>
                                ))}
                            </Card>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ── Discovery tab ─────────────────────────────────────────────────────────────
function DiscoveryTab() {
    const [provider, setProvider] = useState("anthropic");
    const [key, setKey] = useState("");
    const [result, setResult] = useState<unknown>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const probe = async () => {
        setLoading(true);
        setErr("");
        setResult(null);
        try {
            const r = await api<unknown>("/discovery/probe", {
                method: "POST",
                body: JSON.stringify({ provider, key })
            });
            setResult(r);
        } catch (e) {
            setErr(String(e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
                <p
                    style={{
                        fontSize: 13,
                        color: C.sub,
                        marginBottom: 16,
                        lineHeight: 1.6
                    }}
                >
                    Tests a key against all known providers to discover what
                    it's valid for. Keys are never stored — this is a stateless
                    probe.
                </p>
                <SectionLabel>POST /api/discovery/probe</SectionLabel>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
                <select
                    value={provider}
                    onChange={e => setProvider(e.target.value)}
                    style={{
                        background: C.bg,
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        color: C.text,
                        fontSize: 13,
                        padding: "8px 12px",
                        width: 160
                    }}
                >
                    {PROVIDERS.map(p => (
                        <option key={p} value={p}>
                            {p}
                        </option>
                    ))}
                </select>
                <Input
                    value={key}
                    onChange={setKey}
                    placeholder="API key to probe"
                    type="password"
                    mono
                />
                <Btn
                    variant="primary"
                    onClick={probe}
                    disabled={loading || !key}
                >
                    {loading ? "Probing…" : "Probe"}
                </Btn>
            </div>
            {err && <Err msg={err} />}
            {result && <Pre>{JSON.stringify(result, null, 2)}</Pre>}
        </div>
    );
}

// ── Media tab ─────────────────────────────────────────────────────────────────
function MediaTab() {
    const [prompt, setPrompt] = useState(
        "A minimal dark tech interface, abstract"
    );
    const [model, setModel] = useState("dall-e-3");
    const [result, setResult] = useState<unknown>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [providers, setProviders] = useState<unknown>(null);

    useEffect(() => {
        api<unknown>("/media/providers")
            .then(setProviders)
            .catch(() => {});
    }, []);

    const generate = async () => {
        setLoading(true);
        setErr("");
        setResult(null);
        try {
            const r = await api<unknown>("/media/generate", {
                method: "POST",
                body: JSON.stringify({ prompt, model })
            });
            setResult(r);
        } catch (e) {
            setErr(String(e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {providers && (
                <div>
                    <SectionLabel>GET /api/media/providers</SectionLabel>
                    <Pre>{JSON.stringify(providers, null, 2)}</Pre>
                </div>
            )}

            <div>
                <SectionLabel>POST /api/media/generate</SectionLabel>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
                <Input
                    value={model}
                    onChange={setModel}
                    placeholder="dall-e-3 / stable-diffusion-3…"
                    style={{ width: 220 }}
                />
            </div>
            <Textarea
                value={prompt}
                onChange={setPrompt}
                placeholder="Describe the image…"
                rows={3}
            />
            <Btn variant="primary" onClick={generate} disabled={loading}>
                {loading ? "Generating…" : "Generate"}
            </Btn>
            {err && <Err msg={err} />}
            {result && <Pre>{JSON.stringify(result, null, 2)}</Pre>}
        </div>
    );
}

// ── Search tab ────────────────────────────────────────────────────────────────
function SearchTab() {
    const [query, setQuery] = useState("latest AI model benchmarks 2025");
    const [providerS, setProviderS] = useState("brave");
    const [result, setResult] = useState<unknown>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [providers, setProviders] = useState<unknown>(null);

    useEffect(() => {
        api<unknown>("/search/providers")
            .then(setProviders)
            .catch(() => {});
    }, []);

    const search = async () => {
        setLoading(true);
        setErr("");
        setResult(null);
        try {
            const r = await api<unknown>("/search/query", {
                method: "POST",
                body: JSON.stringify({ query, provider: providerS })
            });
            setResult(r);
        } catch (e) {
            setErr(String(e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {providers && (
                <div>
                    <SectionLabel>GET /api/search/providers</SectionLabel>
                    <Pre>{JSON.stringify(providers, null, 2)}</Pre>
                </div>
            )}

            <div>
                <SectionLabel>POST /api/search/query</SectionLabel>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
                <select
                    value={providerS}
                    onChange={e => setProviderS(e.target.value)}
                    style={{
                        background: C.bg,
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        color: C.text,
                        fontSize: 13,
                        padding: "8px 12px",
                        width: 160
                    }}
                >
                    <option value="brave">brave</option>
                    <option value="serpapi">serpapi</option>
                </select>
                <Input
                    value={query}
                    onChange={setQuery}
                    placeholder="Search query…"
                />
                <Btn variant="primary" onClick={search} disabled={loading}>
                    {loading ? "Searching…" : "Search"}
                </Btn>
            </div>
            {err && <Err msg={err} />}
            {result && <Pre>{JSON.stringify(result, null, 2)}</Pre>}
        </div>
    );
}

// ── Code tab ──────────────────────────────────────────────────────────────────
function CodeTab() {
    const [code, setCode] = useState('print("Hello from Conduit sandbox!")');
    const [language, setLanguage] = useState("python");
    const [result, setResult] = useState<unknown>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const execute = async () => {
        setLoading(true);
        setErr("");
        setResult(null);
        try {
            const r = await api<unknown>("/code/execute", {
                method: "POST",
                body: JSON.stringify({ code, language })
            });
            setResult(r);
        } catch (e) {
            setErr(String(e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
                <SectionLabel>POST /api/code/execute</SectionLabel>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
                <select
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    style={{
                        background: C.bg,
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        color: C.text,
                        fontSize: 13,
                        padding: "8px 12px",
                        width: 160
                    }}
                >
                    {[
                        "python",
                        "javascript",
                        "typescript",
                        "bash",
                        "go",
                        "rust"
                    ].map(l => (
                        <option key={l} value={l}>
                            {l}
                        </option>
                    ))}
                </select>
            </div>
            <Textarea value={code} onChange={setCode} rows={8} mono />
            <Btn variant="primary" onClick={execute} disabled={loading}>
                {loading ? "Executing…" : "Execute"}
            </Btn>
            {err && <Err msg={err} />}
            {result && <Pre>{JSON.stringify(result, null, 2)}</Pre>}
        </div>
    );
}

// ── App shell ─────────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; route: string }[] = [
    { id: "status", label: "Status", route: "/api/health · /api/status" },
    { id: "chat", label: "Chat", route: "/api/chat/stream" },
    { id: "keys", label: "Keys", route: "/api/keys" },
    {
        id: "providers",
        label: "Providers",
        route: "/api/providers/health · /api/models"
    },
    { id: "discovery", label: "Discovery", route: "/api/discovery/probe" },
    { id: "media", label: "Media", route: "/api/media/generate" },
    { id: "search", label: "Search", route: "/api/search/query" },
    { id: "code", label: "Code", route: "/api/code/execute" }
];

export default function App() {
    const [tab, setTab] = useState<Tab>("status");
    const active = TABS.find(t => t.id === tab)!;

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
                        fontSize: 14,
                        fontWeight: 700,
                        color: C.text,
                        letterSpacing: "-0.3px",
                        marginRight: 8
                    }}
                >
                    Conduit Gateway
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
                            height: 52,
                            transition: "color 0.15s"
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Sub-header */}
            <div
                style={{
                    padding: "10px 24px",
                    borderBottom: `1px solid ${C.border}`,
                    background: C.surface
                }}
            >
                <span
                    style={{
                        fontSize: 11,
                        fontFamily: "monospace",
                        color: C.dim
                    }}
                >
                    {active.route}
                </span>
            </div>

            {/* Content */}
            <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
                {tab === "status" && <StatusTab />}
                {tab === "chat" && <ChatTab />}
                {tab === "keys" && <KeysTab />}
                {tab === "providers" && <ProvidersTab />}
                {tab === "discovery" && <DiscoveryTab />}
                {tab === "media" && <MediaTab />}
                {tab === "search" && <SearchTab />}
                {tab === "code" && <CodeTab />}
            </div>
        </div>
    );
}

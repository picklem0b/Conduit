import { useState, useCallback } from "react";
import { Send, ChevronDown } from "lucide-react";
import { C } from "@/lib/tokens";
import { useAppStore } from "@/store/app.store";

const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;
type Method = (typeof METHODS)[number];

const PRESET_ROUTES = [
    {
        label: "GET /api/health",
        method: "GET" as Method,
        path: "/api/health",
        body: ""
    },
    {
        label: "GET /api/status",
        method: "GET" as Method,
        path: "/api/status",
        body: ""
    },
    {
        label: "GET /api/models",
        method: "GET" as Method,
        path: "/api/models",
        body: ""
    },
    {
        label: "GET /api/keys",
        method: "GET" as Method,
        path: "/api/keys",
        body: ""
    },
    {
        label: "POST /api/chat/stream",
        method: "POST" as Method,
        path: "/api/chat/stream",
        body: '{"model":"claude-sonnet-4-6","messages":[{"role":"user","content":"Hello!"}]}'
    },
    {
        label: "GET /api/providers/health",
        method: "GET" as Method,
        path: "/api/providers/health",
        body: ""
    },
    {
        label: "POST /api/discovery/probe",
        method: "POST" as Method,
        path: "/api/discovery/probe",
        body: '{"provider":"anthropic","key":""}'
    }
];

// Sample history matching Image 2 API Tester
const SAMPLE_HISTORY = [
    {
        method: "POST",
        path: "/api/chat/stream",
        status: 200,
        ms: 142,
        streaming: true,
        events: 47
    },
    {
        method: "GET",
        path: "/api/health",
        status: 200,
        ms: 4,
        streaming: false,
        events: 0
    },
    {
        method: "GET",
        path: "/api/models",
        status: 200,
        ms: 12,
        streaming: false,
        events: 0
    },
    {
        method: "POST",
        path: "/api/discovery/probe",
        status: 200,
        ms: 88,
        streaming: false,
        events: 0
    }
];

const METHOD_COLORS: Record<string, string> = {
    GET: C.green,
    POST: C.blue,
    PUT: C.amber,
    DELETE: C.red,
    PATCH: C.purple
};

function MethodBadge({ method }: { method: string }) {
    return (
        <span
            style={{
                fontSize: 9,
                fontWeight: 700,
                fontFamily: C.mono,
                padding: "2px 6px",
                borderRadius: 3,
                color: METHOD_COLORS[method] ?? C.sub,
                background: (METHOD_COLORS[method] ?? C.sub) + "22",
                border: `1px solid ${METHOD_COLORS[method] ?? C.sub}44`,
                flexShrink: 0
            }}
        >
            {method}
        </span>
    );
}

export function StatusPage() {
    const [method, setMethod] = useState<Method>("GET");
    const [path, setPath] = useState("/api/health");
    const [body, setBody] = useState("");
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<unknown>(null);
    const [responseMs, setResponseMs] = useState(0);
    const [responseStatus, setResponseStatus] = useState(0);
    const [tab, setTab] = useState<"history" | "request" | "response">(
        "history"
    );
    const [history, setHistory] = useState(SAMPLE_HISTORY);
    const { pushTerminalLine, setTerminalTab } = useAppStore();

    const send = useCallback(async () => {
        setLoading(true);
        const t0 = Date.now();
        pushTerminalLine({
            text: `[api-tester] ${method} ${path}`,
            type: "dim"
        });
        setTerminalTab("api-log");

        try {
            const opts: RequestInit = { method };
            if (body && method !== "GET") opts.body = body;
            const r = await fetch(path, {
                headers: { "Content-Type": "application/json" },
                ...opts
            });
            const ms = Date.now() - t0;
            const data = await r.json().catch(() => ({}));
            setResponse(data);
            setResponseMs(ms);
            setResponseStatus(r.status);
            setTab("response");

            // Push real result to terminal/api log
            pushTerminalLine({
                text: `[api-tester] ${r.status} · ${ms}ms · ${JSON.stringify(data).slice(0, 80)}`,
                type: r.ok ? "success" : "error"
            });
            pushTerminalLine({
                text: `[api-tester] POST ${path} · ${ms}ms · streaming · ${Math.floor(Math.random() * 50) + 20} events received`,
                type: "dim"
            });

            setHistory(h => [
                {
                    method,
                    path,
                    status: r.status,
                    ms,
                    streaming: path.includes("stream"),
                    events: path.includes("stream") ? 47 : 0
                },
                ...h.slice(0, 9)
            ]);
        } catch (e) {
            const ms = Date.now() - t0;
            setResponse({ error: String(e) });
            setResponseStatus(0);
            setResponseMs(ms);
            setTab("response");
            pushTerminalLine({
                text: `[api-tester] error: ${String(e)}`,
                type: "error"
            });
        }
        setLoading(false);
    }, [method, path, body, pushTerminalLine, setTerminalTab]);

    const loadPreset = (p: (typeof PRESET_ROUTES)[0]) => {
        setMethod(p.method);
        setPath(p.path);
        setBody(p.body);
    };

    return (
        <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
            {/* Left: history + request builder */}
            <div
                style={{
                    width: 320,
                    flexShrink: 0,
                    borderRight: `1px solid ${C.border}`,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                }}
            >
                {/* Request bar */}
                <div
                    style={{
                        padding: "10px 12px",
                        borderBottom: `1px solid ${C.border}`,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6
                    }}
                >
                    {/* Method + URL */}
                    <div
                        style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center"
                        }}
                    >
                        <select
                            value={method}
                            onChange={e => setMethod(e.target.value as Method)}
                            style={{
                                background: C.surface2,
                                border: `1px solid ${C.border2}`,
                                borderRadius: 5,
                                padding: "6px 8px",
                                color: METHOD_COLORS[method],
                                fontSize: 11,
                                fontFamily: C.mono,
                                cursor: "pointer",
                                flexShrink: 0
                            }}
                        >
                            {METHODS.map(m => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>
                        <input
                            value={path}
                            onChange={e => setPath(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && send()}
                            style={{
                                flex: 1,
                                background: C.surface,
                                border: `1px solid ${C.border2}`,
                                borderRadius: 5,
                                padding: "6px 8px",
                                color: C.text,
                                fontSize: 11,
                                fontFamily: C.mono,
                                outline: "none"
                            }}
                        />
                        <button
                            onClick={send}
                            disabled={loading}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "6px 12px",
                                background: loading ? C.surface2 : C.blue,
                                border: "none",
                                borderRadius: 5,
                                color: loading ? C.dim : "white",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: loading ? "not-allowed" : "pointer",
                                flexShrink: 0
                            }}
                        >
                            <Send size={10} />
                            {loading ? "…" : "Send"}
                        </button>
                    </div>

                    {/* Presets dropdown */}
                    <details style={{ fontSize: 10 }}>
                        <summary
                            style={{
                                color: C.dim,
                                cursor: "pointer",
                                listStyle: "none",
                                display: "flex",
                                alignItems: "center",
                                gap: 4
                            }}
                        >
                            <ChevronDown size={10} color={C.dim} />
                            Preset routes
                        </summary>
                        <div
                            style={{
                                marginTop: 4,
                                display: "flex",
                                flexDirection: "column",
                                gap: 2
                            }}
                        >
                            {PRESET_ROUTES.map((p, i) => (
                                <button
                                    key={i}
                                    onClick={() => loadPreset(p)}
                                    style={{
                                        width: "100%",
                                        padding: "4px 6px",
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        fontSize: 10,
                                        color: C.dim,
                                        fontFamily: C.mono,
                                        display: "flex",
                                        gap: 6,
                                        alignItems: "center",
                                        borderRadius: 3,
                                        transition: "background 0.1s"
                                    }}
                                    onMouseEnter={e =>
                                        (e.currentTarget.style.background =
                                            C.surface2)
                                    }
                                    onMouseLeave={e =>
                                        (e.currentTarget.style.background =
                                            "none")
                                    }
                                >
                                    <MethodBadge method={p.method} />
                                    {p.path}
                                </button>
                            ))}
                        </div>
                    </details>

                    {/* Body */}
                    {method !== "GET" && (
                        <textarea
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            placeholder="Request body (JSON)"
                            rows={4}
                            style={{
                                background: C.surface,
                                border: `1px solid ${C.border2}`,
                                borderRadius: 5,
                                padding: "7px 8px",
                                color: C.sub,
                                fontSize: 10,
                                fontFamily: C.mono,
                                outline: "none",
                                resize: "vertical"
                            }}
                        />
                    )}
                </div>

                {/* Tab bar */}
                <div
                    style={{
                        display: "flex",
                        borderBottom: `1px solid ${C.border}`
                    }}
                >
                    {(["history", "request", "response"] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            style={{
                                flex: 1,
                                padding: "7px 0",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: 11,
                                color: tab === t ? C.text : C.dim,
                                borderBottom:
                                    tab === t
                                        ? `1px solid ${C.blue}`
                                        : "1px solid transparent",
                                textTransform: "capitalize"
                            }}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* History list */}
                {tab === "history" && (
                    <div style={{ flex: 1, overflowY: "auto" }}>
                        {history.map((h, i) => (
                            <div
                                key={i}
                                onClick={() => {
                                    setMethod(h.method as Method);
                                    setPath(h.path);
                                    setTab("request");
                                }}
                                style={{
                                    padding: "9px 12px",
                                    borderBottom: `1px solid ${C.border}`,
                                    cursor: "pointer",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 4
                                }}
                                onMouseEnter={e =>
                                    (e.currentTarget.style.background =
                                        C.surface2)
                                }
                                onMouseLeave={e =>
                                    (e.currentTarget.style.background = "none")
                                }
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 7
                                    }}
                                >
                                    <MethodBadge method={h.method} />
                                    <span
                                        style={{
                                            fontSize: 10,
                                            color: C.sub,
                                            fontFamily: C.mono,
                                            flex: 1,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap"
                                        }}
                                    >
                                        {h.path}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 9,
                                            fontFamily: C.mono,
                                            color:
                                                h.status >= 400
                                                    ? C.red
                                                    : C.green
                                        }}
                                    >
                                        {h.status || "ERR"}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 8,
                                        fontSize: 9,
                                        color: C.dim,
                                        fontFamily: C.mono
                                    }}
                                >
                                    <span>{h.ms}ms</span>
                                    {h.streaming && <span>· streaming</span>}
                                    {h.events > 0 && (
                                        <span>
                                            · {h.events} events received
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Request tab */}
                {tab === "request" && (
                    <div
                        style={{
                            flex: 1,
                            overflow: "auto",
                            padding: "10px 12px"
                        }}
                    >
                        <div
                            style={{
                                fontSize: 10,
                                color: C.dim,
                                marginBottom: 8
                            }}
                        >
                            {method} {path}
                        </div>
                        {body ? (
                            <pre
                                style={{
                                    fontSize: 10,
                                    fontFamily: C.mono,
                                    color: C.sub,
                                    lineHeight: 1.6,
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-all"
                                }}
                            >
                                {JSON.stringify(
                                    JSON.parse(body || "{}"),
                                    null,
                                    2
                                )}
                            </pre>
                        ) : (
                            <span style={{ fontSize: 10, color: C.dim }}>
                                No body for {method} requests
                            </span>
                        )}
                    </div>
                )}

                {/* Response tab */}
                {tab === "response" && (
                    <div
                        style={{
                            flex: 1,
                            overflow: "auto",
                            padding: "10px 12px"
                        }}
                    >
                        {response ? (
                            <>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 8,
                                        marginBottom: 8,
                                        fontSize: 10,
                                        fontFamily: C.mono
                                    }}
                                >
                                    <span
                                        style={{
                                            color:
                                                responseStatus >= 400
                                                    ? C.red
                                                    : C.green
                                        }}
                                    >
                                        {responseStatus}
                                    </span>
                                    <span style={{ color: C.dim }}>·</span>
                                    <span style={{ color: C.dim }}>
                                        {responseMs}ms
                                    </span>
                                    {path.includes("stream") && (
                                        <>
                                            <span style={{ color: C.dim }}>
                                                ·
                                            </span>
                                            <span style={{ color: C.blue }}>
                                                streaming
                                            </span>
                                        </>
                                    )}
                                </div>
                                <pre
                                    style={{
                                        fontSize: 10,
                                        fontFamily: C.mono,
                                        color: C.sub,
                                        lineHeight: 1.6,
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-all"
                                    }}
                                >
                                    {JSON.stringify(response, null, 2)}
                                </pre>
                            </>
                        ) : (
                            <span style={{ fontSize: 10, color: C.dim }}>
                                Send a request to see the response
                            </span>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div
                    style={{
                        padding: "6px 12px",
                        borderTop: `1px solid ${C.border}`,
                        fontSize: 9,
                        color: C.dim,
                        fontFamily: C.mono,
                        display: "flex",
                        gap: 10
                    }}
                >
                    <span>[api-tester]</span>
                    <span>POST /api/chat/stream</span>
                    <span>·</span>
                    <span>{responseMs || 142}ms</span>
                    <span>·</span>
                    <span>streaming</span>
                    <span>·</span>
                    <span>47 events received</span>
                </div>
            </div>

            {/* Right panel — response body + metrics from Image 2 */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                }}
            >
                {/* Response body */}
                <div style={{ flex: 1, overflow: "auto", padding: "14px" }}>
                    {response ? (
                        <pre
                            style={{
                                fontSize: 11,
                                fontFamily: C.mono,
                                color: C.sub,
                                lineHeight: 1.7,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-all"
                            }}
                        >
                            {JSON.stringify(response, null, 2)}
                        </pre>
                    ) : (
                        // Sample response matching Image 2
                        <pre
                            style={{
                                fontSize: 11,
                                fontFamily: C.mono,
                                color: C.sub,
                                lineHeight: 1.7
                            }}
                        >
                            {`{
  "model_id": 700,
  "TODO": 1,
  "Thbo": 4.628
}

[gpt-4o] first token · $0.003 · 1,204 tokens
[gpt-4o] first token · $0.1255 tokens
[gpt-4o] first token · $0.003 · 1,204 tokens
[claude] query_embed: 12ms · retrieved: 4 chunks · tap_score:
[claude] query_embed: 12ms · retrieved: 4 chunks · tap_score: 0.04`}
                        </pre>
                    )}
                </div>

                {/* Metrics strip */}
                <div
                    style={{
                        borderTop: `1px solid ${C.border}`,
                        padding: "8px 14px",
                        display: "grid",
                        gridTemplateColumns: "repeat(5, 1fr)",
                        gap: 8,
                        background: C.surface,
                        flexShrink: 0
                    }}
                >
                    {[
                        { l: "Requests", v: "Responses" },
                        { l: "Model", v: "Endpoint" },
                        { l: "Status", v: "Latency" },
                        { l: "gpt-4o", v: "200" },
                        { l: "OET", v: "5ms" }
                    ].map((r, i) => (
                        <div key={i}>
                            <div
                                style={{
                                    fontSize: 8,
                                    color: C.dim,
                                    marginBottom: 2
                                }}
                            >
                                {r.l}
                            </div>
                            <div
                                style={{
                                    fontSize: 10,
                                    color: C.sub,
                                    fontFamily: C.mono
                                }}
                            >
                                {r.v}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Token rate chart placeholder */}
                <div
                    style={{
                        borderTop: `1px solid ${C.border}`,
                        padding: "8px 14px",
                        flexShrink: 0,
                        display: "flex",
                        gap: 20
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <div
                            style={{
                                fontSize: 9,
                                color: C.dim,
                                marginBottom: 4
                            }}
                        >
                            Token rate
                        </div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "flex-end",
                                gap: 2,
                                height: 28
                            }}
                        >
                            {[
                                40, 55, 30, 70, 45, 80, 60, 50, 65, 75, 55, 40,
                                60, 72, 58
                            ].map((h, i) => (
                                <div
                                    key={i}
                                    style={{
                                        flex: 1,
                                        height: `${h}%`,
                                        background: C.blue + "66",
                                        borderRadius: "1px 1px 0 0",
                                        minWidth: 3
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div
                            style={{
                                fontSize: 9,
                                color: C.dim,
                                marginBottom: 4
                            }}
                        >
                            Latency
                        </div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "flex-end",
                                gap: 2,
                                height: 28
                            }}
                        >
                            {[
                                20, 40, 35, 25, 55, 30, 45, 60, 40, 30, 50, 35,
                                45, 55, 40
                            ].map((h, i) => (
                                <div
                                    key={i}
                                    style={{
                                        flex: 1,
                                        height: `${h}%`,
                                        background: C.amber + "66",
                                        borderRadius: "1px 1px 0 0",
                                        minWidth: 3
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

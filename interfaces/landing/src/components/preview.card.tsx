import { useEffect, useState } from "react";
import { LogoMark } from "./logo.animated";

const C = {
    bg: "#080808",
    surface: "#0f0f0f",
    surface2: "#141414",
    border: "#1e1e1e",
    border2: "#282828",
    text: "#e5e5e5",
    sub: "#888",
    dim: "#555",
    green: "#22c55e",
    blue: "#3b82f6",
    amber: "#f59e0b",
    amberDim: "rgba(245,158,11,0.08)",
    amberBorder: "rgba(245,158,11,0.2)"
};

const PROVIDERS = [
    { label: "claude-sonnet-4-6", short: "claude-sonnet", dot: "#e8703a" },
    { label: "gpt-4o-mini", short: "gpt-4o-mini", dot: "#74aa9c" },
    { label: "gemini-2.0-flash", short: "gemini-flash", dot: "#4285f4" },
    { label: "llama-3.3-70b", short: "llama-3.3-70b", dot: "#a855f7" }
];

const HISTORY = [
    { label: "Chat", active: true },
    { label: "Gonvetrias a conversation...", active: false },
    { label: "Gonvetrias a conversation...", active: false },
    { label: "Boovegritets", active: false },
    { label: "History history", active: false },
    { label: "History history", active: false },
    { label: "User message", active: false }
];

const STREAM =
    "Hello! I'm here to help with anything you need. I can assist with coding, writing, research, analysis, and much more. What would you like to explore today?";

// Lucide-style SVG icons (inline, no dependency)
function IconMessage({
    size = 10,
    color = C.dim
}: {
    size?: number;
    color?: string;
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    );
}
function IconSettings({
    size = 10,
    color = C.dim
}: {
    size?: number;
    color?: string;
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}
function IconArrowRight({
    size = 8,
    color = C.dim
}: {
    size?: number;
    color?: string;
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
    );
}
function IconChevronDown({
    size = 9,
    color = C.dim
}: {
    size?: number;
    color?: string;
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 9l6 6 6-6" />
        </svg>
    );
}
function IconPlus({
    size = 11,
    color = C.dim
}: {
    size?: number;
    color?: string;
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
        >
            <path d="M12 5v14M5 12h14" />
        </svg>
    );
}
function IconRefreshCw({
    size = 9,
    color = C.amber
}: {
    size?: number;
    color?: string;
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
        </svg>
    );
}
function IconSend({
    size = 11,
    color = "white"
}: {
    size?: number;
    color?: string;
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
    );
}
function IconStar({
    size = 11,
    color = C.dim
}: {
    size?: number;
    color?: string;
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={color}
            stroke="none"
        >
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
        </svg>
    );
}

export function PreviewCard() {
    const [providerIdx, setProviderIdx] = useState(0);
    const [tokens, setTokens] = useState(295);
    const [streamedLen, setStreamedLen] = useState(60);
    const [showCascade, setShowCascade] = useState(false);
    const [cascadeFrom, setCascadeFrom] = useState("");
    const [cascadeTo, setCascadeTo] = useState("");

    // Cascade cycle
    useEffect(() => {
        const t = setInterval(() => {
            setProviderIdx(i => {
                const next = (i + 1) % PROVIDERS.length;
                setCascadeFrom(PROVIDERS[i].short);
                setCascadeTo(PROVIDERS[next].short);
                return next;
            });
            setShowCascade(true);
            setTimeout(() => setShowCascade(false), 2200);
        }, 4500);
        return () => clearInterval(t);
    }, []);

    // Token counter
    useEffect(() => {
        const t = setInterval(() => {
            setTokens(v =>
                v >= 412 ? 295 : v + Math.floor(Math.random() * 3 + 1)
            );
        }, 200);
        return () => clearInterval(t);
    }, []);

    // Streaming text
    useEffect(() => {
        const t = setInterval(() => {
            setStreamedLen(v => (v >= STREAM.length ? 28 : v + 2));
        }, 45);
        return () => clearInterval(t);
    }, []);

    const provider = PROVIDERS[providerIdx];
    const displayedText = STREAM.slice(0, streamedLen);

    return (
        <div
            style={{
                width: "100%",
                maxWidth: 580,
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                overflow: "hidden",
                boxShadow:
                    "0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)",
                fontFamily: "system-ui, -apple-system, sans-serif",
                userSelect: "none"
            }}
        >
            {/* ── Titlebar ── */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 14px",
                    borderBottom: `1px solid ${C.border}`,
                    background: C.bg
                }}
            >
                {/* Traffic lights */}
                <div style={{ display: "flex", gap: 5 }}>
                    {["#ff5f57", "#febc2e", "#28c840"].map(col => (
                        <div
                            key={col}
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                background: col
                            }}
                        />
                    ))}
                </div>
                <div style={{ flex: 1 }} />
                <LogoMark size={16} />
                <div style={{ flex: 1 }} />
                {/* Provider badges */}
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                    {PROVIDERS.slice(0, 3).map((p, i) => (
                        <div
                            key={p.label}
                            style={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                background:
                                    i === providerIdx % 3
                                        ? p.dot + "33"
                                        : C.surface2,
                                border: `1.5px solid ${i === providerIdx % 3 ? p.dot : C.border2}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.35s ease"
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 8,
                                    fontWeight: 700,
                                    color: i === providerIdx % 3 ? p.dot : C.dim
                                }}
                            >
                                {p.label[0].toUpperCase()}
                            </span>
                        </div>
                    ))}
                    <IconArrowRight size={8} color={C.dim} />
                </div>
            </div>

            {/* ── Body ── */}
            <div style={{ display: "flex", height: 340 }}>
                {/* Sidebar */}
                <div
                    style={{
                        width: 155,
                        flexShrink: 0,
                        borderRight: `1px solid ${C.border}`,
                        background: C.bg,
                        display: "flex",
                        flexDirection: "column"
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "9px 12px 7px",
                            borderBottom: `1px solid ${C.border}`
                        }}
                    >
                        <span
                            style={{
                                fontSize: 10,
                                color: C.sub,
                                fontWeight: 600,
                                letterSpacing: "0.01em"
                            }}
                        >
                            Chat history
                        </span>
                        <IconPlus size={11} color={C.dim} />
                    </div>
                    <div
                        style={{
                            flex: 1,
                            padding: "5px 0",
                            overflow: "hidden"
                        }}
                    >
                        {HISTORY.map((item, i) => (
                            <div
                                key={i}
                                style={{
                                    padding: "5px 10px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    background: item.active
                                        ? C.surface2
                                        : "transparent",
                                    margin: item.active ? "1px 4px" : "1px 0",
                                    borderRadius: item.active ? 5 : 0
                                }}
                            >
                                <IconMessage
                                    size={9}
                                    color={item.active ? C.sub : C.dim}
                                />
                                <span
                                    style={{
                                        fontSize: 10,
                                        color: item.active ? C.text : C.dim,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        flex: 1
                                    }}
                                >
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat area */}
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        minWidth: 0,
                        overflow: "hidden"
                    }}
                >
                    {/* Messages */}
                    <div
                        style={{
                            flex: 1,
                            padding: "14px 12px 10px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                            overflow: "hidden"
                        }}
                    >
                        {/* User bubble */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 7,
                                alignItems: "flex-start"
                            }}
                        >
                            <div
                                style={{
                                    background: C.surface2,
                                    border: `1px solid ${C.border2}`,
                                    borderRadius: "10px 10px 2px 10px",
                                    padding: "7px 10px",
                                    fontSize: 11,
                                    color: C.text,
                                    maxWidth: "68%",
                                    lineHeight: 1.5
                                }}
                            >
                                Thank you for conversating here?
                            </div>
                            <div
                                style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: "50%",
                                    background: C.border2,
                                    flexShrink: 0,
                                    marginTop: 2
                                }}
                            />
                        </div>

                        {/* Cascade event */}
                        {showCascade && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "5px 9px",
                                    background: C.amberDim,
                                    border: `1px solid ${C.amberBorder}`,
                                    borderRadius: 6,
                                    fontSize: 10,
                                    color: C.amber
                                }}
                            >
                                <IconRefreshCw size={9} color={C.amber} />
                                <span>cascade</span>
                                <span
                                    style={{
                                        color: C.dim,
                                        fontFamily: "monospace"
                                    }}
                                >
                                    {cascadeFrom}
                                </span>
                                <IconArrowRight size={8} color={C.dim} />
                                <span style={{ fontFamily: "monospace" }}>
                                    {cascadeTo}
                                </span>
                            </div>
                        )}

                        {/* AI bubble */}
                        <div
                            style={{
                                display: "flex",
                                gap: 7,
                                alignItems: "flex-start"
                            }}
                        >
                            <div
                                style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: "50%",
                                    background: C.surface2,
                                    border: `1px solid ${C.border2}`,
                                    flexShrink: 0,
                                    marginTop: 2,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}
                            >
                                <IconStar size={9} color={C.sub} />
                            </div>
                            <div
                                style={{
                                    background: C.surface2,
                                    border: `1px solid ${C.border}`,
                                    borderRadius: "10px 10px 10px 2px",
                                    padding: "7px 10px",
                                    fontSize: 11,
                                    color: C.text,
                                    lineHeight: 1.6,
                                    flex: 1,
                                    minWidth: 0
                                }}
                            >
                                {displayedText}
                                {streamedLen < STREAM.length && (
                                    <span
                                        style={{
                                            color: C.blue,
                                            fontWeight: 700
                                        }}
                                    >
                                        ▌
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Input area */}
                    <div
                        style={{
                            borderTop: `1px solid ${C.border}`,
                            padding: "8px 10px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            background: C.bg
                        }}
                    >
                        {/* Prompt bar */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 10,
                                    color: C.dim,
                                    background: C.surface2,
                                    border: `1px solid ${C.border2}`,
                                    borderRadius: 4,
                                    padding: "3px 7px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4
                                }}
                            >
                                <IconPlus size={8} color={C.dim} />
                                <span>Prompt</span>
                                <IconChevronDown size={7} color={C.dim} />
                            </div>
                            <div style={{ flex: 1 }} />
                            <IconChevronDown size={8} color={C.dim} />
                        </div>

                        {/* Message input */}
                        <div
                            style={{
                                background: C.surface,
                                border: `1px solid ${C.border2}`,
                                borderRadius: 7,
                                padding: "7px 9px",
                                display: "flex",
                                alignItems: "center",
                                gap: 8
                            }}
                        >
                            <span
                                style={{ fontSize: 11, color: C.dim, flex: 1 }}
                            >
                                Type your message…
                            </span>
                            <div
                                style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: 5,
                                    background: C.blue,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0
                                }}
                            >
                                <IconSend size={10} color="white" />
                            </div>
                        </div>

                        {/* Footer links */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4
                                }}
                            >
                                <IconSettings size={9} color={C.dim} />
                                <span style={{ fontSize: 9, color: C.dim }}>
                                    Settings
                                </span>
                            </div>
                            <div style={{ display: "flex", gap: 10 }}>
                                <span style={{ fontSize: 9, color: C.dim }}>
                                    Chat history · More messages
                                </span>
                                <span style={{ fontSize: 9, color: C.dim }}>
                                    Context filters
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right panel — token counter + model selector */}
                <div
                    style={{
                        width: 138,
                        flexShrink: 0,
                        borderLeft: `1px solid ${C.border}`,
                        background: C.bg,
                        padding: "12px 10px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                        overflow: "hidden"
                    }}
                >
                    {/* Token counter */}
                    <div>
                        <div
                            style={{
                                fontSize: 9,
                                color: C.dim,
                                marginBottom: 4,
                                textTransform: "uppercase",
                                letterSpacing: "0.09em",
                                fontWeight: 600
                            }}
                        >
                            Token counter
                        </div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "baseline",
                                gap: 3
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 19,
                                    fontWeight: 700,
                                    fontFamily: "monospace",
                                    color: C.text,
                                    letterSpacing: "-0.03em"
                                }}
                            >
                                {tokens}
                            </span>
                            <span style={{ fontSize: 9, color: C.dim }}>
                                token
                            </span>
                        </div>
                        <div
                            style={{
                                marginTop: 5,
                                height: 2,
                                background: C.border,
                                borderRadius: 1
                            }}
                        >
                            <div
                                style={{
                                    height: "100%",
                                    borderRadius: 1,
                                    width: `${Math.min((tokens / 500) * 100, 100)}%`,
                                    background:
                                        tokens > 380 ? C.amber : C.green,
                                    transition:
                                        "width 0.2s ease, background 0.3s ease"
                                }}
                            />
                        </div>
                    </div>

                    {/* Model selector */}
                    <div>
                        <div
                            style={{
                                fontSize: 9,
                                color: C.dim,
                                marginBottom: 5,
                                textTransform: "uppercase",
                                letterSpacing: "0.09em",
                                fontWeight: 600
                            }}
                        >
                            Model selector
                        </div>

                        {/* Active model pill */}
                        <div
                            style={{
                                background: C.surface2,
                                border: `1px solid ${C.border2}`,
                                borderRadius: 5,
                                padding: "5px 8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 4
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 9,
                                    color: C.text,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    flex: 1
                                }}
                            >
                                {provider.short}
                            </span>
                            <IconChevronDown size={8} color={C.dim} />
                        </div>

                        {/* Dropdown list */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 1
                            }}
                        >
                            {PROVIDERS.map((p, i) => (
                                <div
                                    key={p.label}
                                    style={{
                                        padding: "4px 7px",
                                        borderRadius: 4,
                                        background:
                                            i === providerIdx
                                                ? "rgba(59,130,246,0.1)"
                                                : "transparent",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 5,
                                        border:
                                            i === providerIdx
                                                ? "1px solid rgba(59,130,246,0.2)"
                                                : "1px solid transparent",
                                        transition: "all 0.3s ease"
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 5,
                                            height: 5,
                                            borderRadius: "50%",
                                            background: p.dot,
                                            boxShadow:
                                                i === providerIdx
                                                    ? `0 0 5px ${p.dot}`
                                                    : "none",
                                            transition: "box-shadow 0.3s ease",
                                            flexShrink: 0
                                        }}
                                    />
                                    <span
                                        style={{
                                            fontSize: 9,
                                            color:
                                                i === providerIdx
                                                    ? C.text
                                                    : C.dim,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap"
                                        }}
                                    >
                                        {p.short}
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

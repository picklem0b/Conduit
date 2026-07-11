import { useState } from "react";

const C = {
    bg: "#080808",
    surface: "#0f0f0f",
    surface2: "#141414",
    border: "#1e1e1e",
    border2: "#2a2a2a",
    text: "#e5e5e5",
    sub: "#999",
    dim: "#555",
    green: "#22c55e",
    greenDim: "#052e16",
    blue: "#3b82f6",
    blueDim: "#0c1a2e",
    amber: "#f59e0b"
};

function IconCopy({
    size = 12,
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
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
    );
}
function IconCheck({
    size = 12,
    color = C.green
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
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}
function IconExternalLink({
    size = 12,
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
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
    );
}
function IconDocker({
    size = 16,
    color = "#2496ed"
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
            aria-hidden="true"
        >
            <path d="M13.983 11.078h2.119a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.119a.185.185 0 0 0-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 0 0 .186-.186V3.574a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 0 0 .186-.186V6.29a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 0 0 .184-.186V6.29a.185.185 0 0 0-.185-.185H8.1a.185.185 0 0 0-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 0 0 .185-.186V6.29a.185.185 0 0 0-.185-.185H5.136a.186.186 0 0 0-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 0 0 .185-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.186.186 0 0 0-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.186.186 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.185.186v1.887c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 0 0-.75.748 11.376 11.376 0 0 0 .692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 0 0 3.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z" />
        </svg>
    );
}

// Copy-able code block
function CodeBlock({
    lines,
    onCopy,
    copied
}: {
    lines: { text: string; type: "comment" | "cmd" | "success" | "plain" }[];
    onCopy: () => void;
    copied: boolean;
}) {
    const colorOf = (t: string) => {
        if (t === "comment") return C.dim;
        if (t === "success") return C.green;
        if (t === "cmd") return C.sub;
        return C.text;
    };

    return (
        <div
            style={{
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                overflow: "hidden"
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 14px",
                    borderBottom: `1px solid ${C.border}`,
                    background: C.surface
                }}
            >
                <span
                    style={{
                        fontSize: 10,
                        color: C.dim,
                        fontFamily: "monospace"
                    }}
                >
                    bash
                </span>
                <button
                    onClick={onCopy}
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 11,
                        color: copied ? C.green : C.dim,
                        padding: "2px 6px"
                    }}
                >
                    {copied ? (
                        <IconCheck size={11} color={C.green} />
                    ) : (
                        <IconCopy size={11} color={C.dim} />
                    )}
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>
            <div
                style={{
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4
                }}
            >
                {lines.map((l, i) => (
                    <div
                        key={i}
                        style={{
                            fontSize: 12,
                            fontFamily:
                                "ui-monospace, 'Cascadia Code', monospace",
                            color: colorOf(l.type),
                            lineHeight: 1.6
                        }}
                    >
                        {l.type === "comment" ? (
                            l.text
                        ) : (
                            <>
                                <span style={{ color: C.dim, marginRight: 8 }}>
                                    {l.type === "success" ? "✓" : "$"}
                                </span>
                                <span
                                    style={{
                                        color:
                                            l.type === "success"
                                                ? C.green
                                                : C.text
                                    }}
                                >
                                    {l.text}
                                </span>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

const DOCKER_LINES = [
    { text: "# 1. Clone", type: "comment" as const },
    {
        text: "git clone https://github.com/picklem0b/conduit && cd conduit",
        type: "cmd" as const
    },
    { text: "# 2. Configure", type: "comment" as const },
    { text: "cp .env.example .env", type: "cmd" as const },
    { text: "# 3. Start", type: "comment" as const },
    { text: "docker compose up --build -d", type: "cmd" as const },
    { text: "# 4. Migrate", type: "comment" as const },
    {
        text: "docker compose exec gateway bun run migrate",
        type: "cmd" as const
    },
    { text: "Gateway live at http://localhost:4000", type: "success" as const }
];

const RENDER_LINES = [
    {
        text: "# Render free tier — no credit card required",
        type: "comment" as const
    },
    { text: "# 1. Fork the repo on GitHub", type: "comment" as const },
    {
        text: "# 2. Create Postgres + Redis on Render dashboard",
        type: "comment" as const
    },
    {
        text: "# 3. New Web Service → Docker → root: gateway/",
        type: "comment" as const
    },
    { text: "# 4. Set env vars:", type: "comment" as const },
    { text: "POSTGRES_URL=<from managed Postgres>", type: "cmd" as const },
    { text: "REDIS_URL=<from managed Redis>", type: "cmd" as const },
    { text: "JWT_SECRET=$(openssl rand -hex 32)", type: "cmd" as const },
    { text: "SELF_URL=<your-engine.onrender.com>", type: "cmd" as const },
    { text: "Gateway deploys automatically on push", type: "success" as const }
];

const DOCKER_ALL = DOCKER_LINES.map(l => l.text).join("\n");
const RENDER_ALL = RENDER_LINES.map(l => l.text).join("\n");

// Stats in the bottom strip
const STATS = [
    { label: "25", sub: "API endpoints" },
    { label: "11", sub: "route groups" },
    { label: "5", sub: "chat providers" },
    { label: "v0.3", sub: "current version" }
];

export function DeploySection() {
    const [tab, setTab] = useState<"docker" | "render">("docker");
    const [copiedDocker, setCopiedDocker] = useState(false);
    const [copiedRender, setCopiedRender] = useState(false);

    const copyDocker = () => {
        navigator.clipboard.writeText(DOCKER_ALL).then(() => {
            setCopiedDocker(true);
            setTimeout(() => setCopiedDocker(false), 2000);
        });
    };
    const copyRender = () => {
        navigator.clipboard.writeText(RENDER_ALL).then(() => {
            setCopiedRender(true);
            setTimeout(() => setCopiedRender(false), 2000);
        });
    };

    return (
        <section
            style={{
                background: C.bg,
                borderTop: `1px solid ${C.border}`,
                padding: "80px 24px 0"
            }}
        >
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                {/* Header */}
                <div style={{ marginBottom: 40 }}>
                    <div
                        style={{
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: C.dim,
                            marginBottom: 10
                        }}
                    >
                        Deploy
                    </div>
                    <h2
                        style={{
                            fontSize: "clamp(28px, 4vw, 40px)",
                            fontWeight: 300,
                            color: C.text,
                            letterSpacing: "-0.03em",
                            lineHeight: 1.1
                        }}
                    >
                        Up in 60 seconds.
                    </h2>
                    <p
                        style={{
                            fontSize: 15,
                            color: C.sub,
                            marginTop: 10,
                            lineHeight: 1.6,
                            maxWidth: 500
                        }}
                    >
                        Docker Compose for local or VPS. Render for
                        zero-infrastructure hosting. Either way, only port 4000
                        is exposed externally.
                    </p>
                </div>

                {/* Tab switcher */}
                <div
                    style={{
                        display: "flex",
                        gap: 0,
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        overflow: "hidden",
                        width: "fit-content",
                        marginBottom: 24
                    }}
                >
                    {(["docker", "render"] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            style={{
                                padding: "9px 20px",
                                border: "none",
                                cursor: "pointer",
                                background: tab === t ? C.surface2 : C.surface,
                                color: tab === t ? C.text : C.dim,
                                fontSize: 13,
                                fontWeight: tab === t ? 600 : 400,
                                display: "flex",
                                alignItems: "center",
                                gap: 7,
                                borderRight:
                                    t === "docker"
                                        ? `1px solid ${C.border}`
                                        : "none",
                                transition: "all 0.15s"
                            }}
                        >
                            {t === "docker" && <IconDocker size={14} />}
                            {t === "docker"
                                ? "Docker Compose"
                                : "Render (free tier)"}
                        </button>
                    ))}
                </div>

                {/* Two-col layout: code left, notes right */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1.2fr 1fr",
                        gap: 24,
                        alignItems: "start"
                    }}
                    className="deploy-grid"
                >
                    {tab === "docker" ? (
                        <CodeBlock
                            lines={DOCKER_LINES}
                            onCopy={copyDocker}
                            copied={copiedDocker}
                        />
                    ) : (
                        <CodeBlock
                            lines={RENDER_LINES}
                            onCopy={copyRender}
                            copied={copiedRender}
                        />
                    )}

                    {/* Side notes */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 16
                        }}
                    >
                        {tab === "docker" ? (
                            <>
                                <Note title="What spins up">
                                    Gateway (port 4000), Engine (internal 8000),
                                    Postgres, Redis. All on an internal{" "}
                                    <code>conduit</code> Docker network — only
                                    the gateway is exposed.
                                </Note>
                                <Note title="Minimum .env">
                                    Set <code>POSTGRES_PASSWORD</code>,{" "}
                                    <code>JWT_SECRET</code> (run{" "}
                                    <code>openssl rand -hex 32</code>), and at
                                    least one provider key like{" "}
                                    <code>ANTHROPIC_API_KEY</code>.
                                </Note>
                                <Note title="Updates">
                                    <code>
                                        git pull && docker compose up --build -d
                                        && docker compose exec gateway bun run
                                        migrate
                                    </code>
                                </Note>
                            </>
                        ) : (
                            <>
                                <Note title="Free tier keepalive">
                                    Set <code>SELF_URL</code> on the engine
                                    service. The engine pings its own{" "}
                                    <code>/health</code> every 14 minutes to
                                    prevent Render from spinning it down.
                                </Note>
                                <Note title="Managed databases">
                                    Render's managed Postgres and Redis are
                                    available on the free tier. Copy the
                                    internal connection strings — never the
                                    external ones.
                                </Note>
                                <Note title="Tester interface">
                                    The tester's status page pings the gateway
                                    on load, keeping the gateway warm even on
                                    the free tier.
                                </Note>
                            </>
                        )}

                        <a
                            href="https://github.com/picklem0b/conduit/tree/main/docs/deployment"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                fontSize: 13,
                                color: C.blue,
                                textDecoration: "none",
                                padding: "9px 14px",
                                border: `1px solid rgba(59,130,246,0.25)`,
                                borderRadius: 6,
                                background: "rgba(59,130,246,0.06)",
                                width: "fit-content"
                            }}
                        >
                            Full deployment docs
                            <IconExternalLink size={11} color={C.blue} />
                        </a>
                    </div>
                </div>
            </div>

            {/* ── Bottom stats strip ── */}
            <div
                style={{
                    borderTop: `1px solid ${C.border}`,
                    marginTop: 80,
                    padding: "32px 24px"
                }}
            >
                <div
                    style={{
                        maxWidth: 1100,
                        margin: "0 auto",
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: 0
                    }}
                    className="stats-strip"
                >
                    {STATS.map((s, i) => (
                        <div
                            key={s.label}
                            style={{
                                textAlign: "center",
                                padding: "20px 0",
                                borderRight:
                                    i < STATS.length - 1
                                        ? `1px solid ${C.border}`
                                        : "none"
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 36,
                                    fontWeight: 700,
                                    color: C.text,
                                    fontFamily: "monospace",
                                    letterSpacing: "-0.04em",
                                    lineHeight: 1
                                }}
                            >
                                {s.label}
                            </div>
                            <div
                                style={{
                                    fontSize: 12,
                                    color: C.dim,
                                    marginTop: 6,
                                    letterSpacing: "0.02em"
                                }}
                            >
                                {s.sub}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Footer ── */}
            <div
                style={{
                    borderTop: `1px solid ${C.border}`,
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 10
                }}
            >
                <div
                    style={{
                        maxWidth: 1100,
                        margin: "0 auto",
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 10
                    }}
                >
                    <span style={{ fontSize: 12, color: C.dim }}>
                        Conduit v0.3.0 — MIT License
                    </span>
                    <div style={{ display: "flex", gap: 16 }}>
                        {[
                            {
                                label: "GitHub",
                                href: "https://github.com/picklem0b/conduit"
                            },
                            { label: "Docs", href: "/api/docs" },
                            { label: "Gateway", href: "http://localhost:4000" }
                        ].map(l => (
                            <a
                                key={l.label}
                                href={l.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    fontSize: 12,
                                    color: C.dim,
                                    textDecoration: "none"
                                }}
                            >
                                {l.label}
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
        @media (max-width: 680px) {
          .deploy-grid { grid-template-columns: 1fr !important; }
          .stats-strip { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
        </section>
    );
}

function Note({
    title,
    children
}: {
    title: string;
    children: React.ReactNode;
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
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.sub,
                    marginBottom: 6
                }}
            >
                {title}
            </div>
            <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.6 }}>
                {children}
            </div>
        </div>
    );
}

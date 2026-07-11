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
    amber: "#f59e0b",
    amberDim: "#2d1a00",
    purple: "#a855f7",
    purpleDim: "#1a0a2e"
};

// Inline Lucide SVGs
function IconZap({
    size = 16,
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
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    );
}
function IconLayers({
    size = 16,
    color = C.blue
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
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
        </svg>
    );
}
function IconLock({
    size = 16,
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
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );
}
function IconBox({
    size = 16,
    color = C.purple
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
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
    );
}
function IconArrowRight({
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
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14M12 5l7 7-7 7" />
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

// ── Cascade visualiser — live health bars for the cascade feature card
function CascadeVisual() {
    const providers = [
        {
            name: "claude-sonnet-4-6",
            score: 0.92,
            color: "#e8703a",
            active: true
        },
        { name: "gpt-4o-mini", score: 0.78, color: "#74aa9c", active: false },
        {
            name: "gemini-2.0-flash",
            score: 0.61,
            color: "#4285f4",
            active: false
        },
        { name: "llama-3.3-70b", score: 0.45, color: "#a855f7", active: false }
    ];

    return (
        <div
            style={{
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 7
            }}
        >
            {/* SSE cascade event */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 8px",
                    background: "rgba(245,158,11,0.07)",
                    border: "1px solid rgba(245,158,11,0.15)",
                    borderRadius: 5,
                    marginBottom: 4,
                    fontSize: 10,
                    color: C.amber,
                    fontFamily: "monospace"
                }}
            >
                <IconRefreshCw size={8} color={C.amber} />
                <span>cascade</span>
                <span style={{ color: C.dim }}>gpt-4o</span>
                <IconArrowRight size={8} color={C.dim} />
                <span>claude-sonnet-4-6</span>
                <span style={{ color: C.dim, marginLeft: "auto" }}>
                    rate_limit
                </span>
            </div>

            {providers.map(p => (
                <div
                    key={p.name}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                    <div
                        style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: p.active ? p.color : C.dim,
                            boxShadow: p.active ? `0 0 6px ${p.color}` : "none",
                            flexShrink: 0
                        }}
                    />
                    <span
                        style={{
                            fontSize: 10,
                            fontFamily: "monospace",
                            color: p.active ? C.text : C.dim,
                            width: 140,
                            flexShrink: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                        }}
                    >
                        {p.name}
                    </span>
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
                                width: `${p.score * 100}%`,
                                height: "100%",
                                background:
                                    p.score > 0.75
                                        ? C.green
                                        : p.score > 0.55
                                          ? C.amber
                                          : C.dim,
                                borderRadius: 2
                            }}
                        />
                    </div>
                    <span
                        style={{
                            fontSize: 9,
                            fontFamily: "monospace",
                            color: p.active ? C.text : C.dim,
                            width: 30,
                            textAlign: "right",
                            flexShrink: 0
                        }}
                    >
                        {(p.score * 100).toFixed(0)}%
                    </span>
                </div>
            ))}
        </div>
    );
}

// ── Provider grid — for the multi-provider feature card
function ProviderGrid() {
    const chat = [
        { id: "anthropic", label: "Anthropic", models: 3, dot: "#e8703a" },
        { id: "openai", label: "OpenAI", models: 3, dot: "#74aa9c" },
        { id: "google", label: "Google", models: 3, dot: "#4285f4" },
        { id: "groq", label: "Groq", models: 3, dot: "#a855f7" },
        { id: "ollama", label: "Ollama", models: null, dot: C.dim }
    ];
    const media = [
        { id: "dall-e", label: "DALL·E", dot: "#74aa9c" },
        { id: "stability", label: "Stability", dot: "#f472b6" }
    ];
    const search = [
        { id: "brave", label: "Brave", dot: "#f97316" },
        { id: "serpapi", label: "SerpAPI", dot: "#22c55e" }
    ];

    const Row = ({
        items,
        label
    }: {
        items: {
            id: string;
            label: string;
            dot: string;
            models?: number | null;
        }[];
        label: string;
    }) => (
        <div>
            <div
                style={{
                    fontSize: 9,
                    color: C.dim,
                    marginBottom: 5,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em"
                }}
            >
                {label}
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {items.map(p => (
                    <div
                        key={p.id}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "4px 8px",
                            background: C.surface2,
                            border: `1px solid ${C.border2}`,
                            borderRadius: 5,
                            fontSize: 10,
                            color: C.sub
                        }}
                    >
                        <div
                            style={{
                                width: 5,
                                height: 5,
                                borderRadius: "50%",
                                background: p.dot,
                                flexShrink: 0
                            }}
                        />
                        {p.label}
                        {p.models !== undefined && p.models !== null && (
                            <span style={{ color: C.dim }}>·{p.models}</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Row items={chat} label="Chat" />
            <Row items={media} label="Image" />
            <Row items={search} label="Search" />
        </div>
    );
}

// ── Key flow visual — for the privacy feature card
function KeyFlowVisual() {
    const steps = [
        { label: "Your key", sub: "env or UI", color: C.green },
        { label: "Gateway", sub: "localhost:4000", color: C.blue },
        { label: "Provider API", sub: "anthropic.com", color: C.dim }
    ];

    return (
        <div
            style={{
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "14px",
                display: "flex",
                alignItems: "center",
                gap: 0
            }}
        >
            {steps.map((s, i) => (
                <div
                    key={s.label}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        flex: i === 1 ? 1 : "none"
                    }}
                >
                    <div
                        style={{
                            padding: "8px 12px",
                            background: C.surface2,
                            border: `1px solid ${C.border2}`,
                            borderRadius: 7,
                            textAlign: "center",
                            whiteSpace: "nowrap"
                        }}
                    >
                        <div
                            style={{
                                fontSize: 11,
                                color: s.color,
                                fontWeight: 600
                            }}
                        >
                            {s.label}
                        </div>
                        <div
                            style={{
                                fontSize: 9,
                                color: C.dim,
                                marginTop: 2,
                                fontFamily: "monospace"
                            }}
                        >
                            {s.sub}
                        </div>
                    </div>
                    {i < steps.length - 1 && (
                        <div
                            style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "0 6px"
                            }}
                        >
                            <div
                                style={{
                                    flex: 1,
                                    height: 1,
                                    background: C.border
                                }}
                            />
                            <IconArrowRight size={10} color={C.dim} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// ── Docker snippet — for the self-host feature card
function DockerSnippet() {
    const lines = [
        {
            prompt: "$",
            cmd: "git clone",
            arg: "github.com/conduit-ai/conduit",
            color: C.sub
        },
        { prompt: "$", cmd: "cp", arg: ".env.example .env", color: C.sub },
        {
            prompt: "$",
            cmd: "docker compose up",
            arg: "--build -d",
            color: "#4ade80"
        },
        {
            prompt: "✓",
            cmd: "Gateway live",
            arg: "localhost:4000",
            color: C.green
        }
    ];

    return (
        <div
            style={{
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "12px 14px",
                fontFamily: "ui-monospace, 'Cascadia Code', monospace",
                display: "flex",
                flexDirection: "column",
                gap: 5
            }}
        >
            {lines.map((l, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 11 }}>
                    <span
                        style={{
                            color: l.color === C.green ? C.green : C.dim,
                            width: 10,
                            flexShrink: 0
                        }}
                    >
                        {l.prompt}
                    </span>
                    <span style={{ color: l.color }}>{l.cmd}</span>
                    <span style={{ color: C.dim }}>{l.arg}</span>
                </div>
            ))}
        </div>
    );
}

// ── Feature card
function FeatureCard({
    icon,
    iconBg,
    title,
    desc,
    visual
}: {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    desc: string;
    visual: React.ReactNode;
}) {
    return (
        <div
            style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: 18
            }}
        >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        flexShrink: 0,
                        background: iconBg,
                        border: `1px solid ${C.border2}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    {icon}
                </div>
                <div>
                    <div
                        style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: C.text,
                            letterSpacing: "-0.02em",
                            marginBottom: 5
                        }}
                    >
                        {title}
                    </div>
                    <div
                        style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}
                    >
                        {desc}
                    </div>
                </div>
            </div>
            {visual}
        </div>
    );
}

export function FeaturesSection() {
    return (
        <section
            style={{
                background: C.bg,
                borderTop: `1px solid ${C.border}`,
                padding: "80px 24px"
            }}
        >
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                <div style={{ marginBottom: 48 }}>
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
                        How it works
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
                        One gateway.
                        <br />
                        Every model.
                    </h2>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: 16
                    }}
                    className="features-grid"
                >
                    <FeatureCard
                        icon={<IconZap size={16} color={C.amber} />}
                        iconBg={C.amberDim}
                        title="Cascade fallback"
                        desc="When a provider hits a rate limit or errors, Conduit automatically switches to the next model — summarising context so it picks up exactly where it left off."
                        visual={<CascadeVisual />}
                    />
                    <FeatureCard
                        icon={<IconLayers size={16} color={C.blue} />}
                        iconBg={C.blueDim}
                        title="5 providers, 1 API"
                        desc="Anthropic, OpenAI, Google, Groq, and Ollama for chat. Stability and DALL·E for images. Brave and SerpAPI for search. All through the same endpoint."
                        visual={<ProviderGrid />}
                    />
                    <FeatureCard
                        icon={<IconLock size={16} color={C.green} />}
                        iconBg={C.greenDim}
                        title="Keys never leave your machine"
                        desc="API keys are stored encrypted in your own Postgres instance and sent directly to provider endpoints. No third-party relay, no key escrow."
                        visual={<KeyFlowVisual />}
                    />
                    <FeatureCard
                        icon={<IconBox size={16} color={C.purple} />}
                        iconBg={C.purpleDim}
                        title="Self-hosted in 60 seconds"
                        desc="One Docker Compose file brings up the gateway, engine, Postgres, and Redis. SQLite fallback means you can run locally with zero infrastructure."
                        visual={<DockerSnippet />}
                    />
                </div>
            </div>

            <style>{`
        @media (max-width: 680px) {
          .features-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
        </section>
    );
}

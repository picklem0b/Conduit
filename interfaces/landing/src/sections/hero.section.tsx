import { useEffect, useState } from "react";
import { Logo } from "../components/logo.animated";
import { PreviewCard } from "../components/preview.card";
import { probeGateway } from "../lib/api.lib";

const C = {
    bg: "#080808",
    surface: "#0f0f0f",
    border: "#1e1e1e",
    border2: "#2a2a2a",
    text: "#e5e5e5",
    sub: "#999",
    dim: "#555",
    green: "#22c55e",
    greenDim: "#052e16",
    blue: "#3b82f6",
    blueDim: "#0c1a2e",
    blueBorder: "rgba(59,130,246,0.3)"
};

function IconGithub({
    size = 15,
    color = "currentColor"
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
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
    );
}

function IconExternalLink({
    size = 12,
    color = "currentColor"
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
            aria-hidden="true"
        >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
    );
}

function IconTerminal({
    size = 13,
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
            aria-hidden="true"
        >
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
    );
}

function IconCheck({
    size = 11,
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
            aria-hidden="true"
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

function IconRadio({
    size = 8,
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
            fill={color}
            aria-hidden="true"
        >
            <circle cx="12" cy="12" r="10" />
        </svg>
    );
}

// Stat pill exactly matching the reference: bordered, dark, monospace feel
function StatPill({ label }: { label: string }) {
    return (
        <div
            style={{
                padding: "9px 20px",
                border: `1px solid ${C.border2}`,
                borderRadius: 999,
                fontSize: 13,
                color: C.sub,
                background: C.surface,
                whiteSpace: "nowrap",
                letterSpacing: "-0.01em"
            }}
        >
            {label}
        </div>
    );
}

// 4-pointed star decoration — matches images
function StarDecal({
    size = 20,
    style
}: {
    size?: number;
    style?: React.CSSProperties;
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={C.dim}
            style={style}
            aria-hidden="true"
        >
            <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" />
        </svg>
    );
}

export function HeroSection() {
    const [gatewayLive, setGatewayLive] = useState<boolean | null>(null);
    const [copied, setCopied] = useState(false);

    const DEPLOY_CMD =
        "git clone https://github.com/conduit-ai/conduit && cd conduit && docker compose up --build -d";

    useEffect(() => {
        probeGateway().then(r => setGatewayLive(r.alive));
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(DEPLOY_CMD).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <section
            style={{
                minHeight: "100dvh",
                background: C.bg,
                display: "flex",
                flexDirection: "column",
                padding: "0 24px",
                position: "relative",
                overflow: "hidden"
            }}
        >
            {/* ── Nav ── */}
            <nav
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "20px 0",
                    borderBottom: `1px solid ${C.border}`,
                    flexShrink: 0
                }}
            >
                <Logo size={28} animate withText textSize={18} />

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {/* Live gateway indicator — only shown if running locally */}
                    {gatewayLive === true && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                fontSize: 11,
                                color: C.green,
                                padding: "4px 10px",
                                background: C.greenDim,
                                border: `1px solid rgba(34,197,94,0.2)`,
                                borderRadius: 999
                            }}
                        >
                            <IconRadio size={6} color={C.green} />
                            gateway live
                        </div>
                    )}
                    <a
                        href="https://github.com/conduit-ai/conduit"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 13,
                            color: C.sub,
                            textDecoration: "none",
                            padding: "6px 12px",
                            border: `1px solid ${C.border}`,
                            borderRadius: 6,
                            background: C.surface,
                            transition: "border-color 0.15s, color 0.15s"
                        }}
                    >
                        <IconGithub size={14} color={C.sub} />
                        GitHub
                    </a>
                </div>
            </nav>

            {/* ── Main hero layout ── */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0,
                    paddingTop: 40,
                    paddingBottom: 60
                }}
            >
                {/* Desktop: two-col. Mobile: stacked */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0,1fr) minmax(0,1.4fr)",
                        gap: 48,
                        width: "100%",
                        maxWidth: 1100,
                        alignItems: "center"
                    }}
                    className="hero-grid"
                >
                    {/* Left column */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 28
                        }}
                    >
                        {/* Large logo mark */}
                        <div>
                            <Logo size={80} animate={false} />
                        </div>

                        {/* Headline */}
                        <div>
                            <h1
                                style={{
                                    fontSize: "clamp(40px, 5vw, 56px)",
                                    fontWeight: 300,
                                    color: C.text,
                                    lineHeight: 1.05,
                                    letterSpacing: "-0.03em",
                                    margin: 0
                                }}
                            >
                                Conduit
                            </h1>
                            <p
                                style={{
                                    fontSize: "clamp(16px, 2.2vw, 22px)",
                                    fontWeight: 300,
                                    color: C.sub,
                                    lineHeight: 1.4,
                                    letterSpacing: "-0.01em",
                                    marginTop: 10,
                                    maxWidth: 440
                                }}
                            >
                                The open-source interface layer
                                <br />
                                for every API key you own.
                            </p>
                        </div>

                        {/* CTA buttons */}
                        <div
                            style={{
                                display: "flex",
                                gap: 10,
                                flexWrap: "wrap"
                            }}
                        >
                            <a
                                href="https://github.com/conduit-ai/conduit"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 7,
                                    padding: "11px 20px",
                                    background: C.text,
                                    color: C.bg,
                                    borderRadius: 7,
                                    fontSize: 14,
                                    fontWeight: 600,
                                    textDecoration: "none",
                                    letterSpacing: "-0.01em"
                                }}
                            >
                                <IconGithub size={15} color={C.bg} />
                                View on GitHub
                            </a>
                            <a
                                href="/api/docs"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 7,
                                    padding: "11px 20px",
                                    background: "none",
                                    color: C.sub,
                                    border: `1px solid ${C.border2}`,
                                    borderRadius: 7,
                                    fontSize: 14,
                                    fontWeight: 400,
                                    textDecoration: "none"
                                }}
                            >
                                API Docs
                                <IconExternalLink size={12} color={C.dim} />
                            </a>
                        </div>

                        {/* Feature checks */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 7
                            }}
                        >
                            {[
                                "Automatic cascade fallback across 5 providers",
                                "Health scoring — highest score served first",
                                "Keys stay on your machine, never leave",
                                "One Docker command to self-host everything"
                            ].map(feat => (
                                <div
                                    key={feat}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8
                                    }}
                                >
                                    <IconCheck size={11} color={C.green} />
                                    <span
                                        style={{ fontSize: 13, color: C.sub }}
                                    >
                                        {feat}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right column — preview card */}
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <PreviewCard />
                    </div>
                </div>

                {/* ── Stat pills ── */}
                <div
                    style={{
                        display: "flex",
                        gap: 10,
                        marginTop: 48,
                        flexWrap: "wrap",
                        justifyContent: "center"
                    }}
                >
                    <StatPill label="5 providers" />
                    <StatPill label="1 key input" />
                    <StatPill label="0 data leaves your machine" />
                </div>

                {/* ── Deploy command block ── */}
                <div
                    style={{
                        marginTop: 48,
                        width: "100%",
                        maxWidth: 860,
                        display: "flex",
                        gap: 0,
                        border: `1px solid ${C.border2}`,
                        borderRadius: 10,
                        overflow: "hidden",
                        background: C.surface
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "16px 20px",
                            flex: 1,
                            minWidth: 0
                        }}
                    >
                        <IconTerminal size={14} color={C.dim} />
                        <code
                            style={{
                                fontSize: 13,
                                fontFamily:
                                    "ui-monospace, 'Cascadia Code', monospace",
                                color: C.sub,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                            }}
                        >
                            <span style={{ color: C.dim }}>$ </span>
                            <span style={{ color: "#4ade80" }}>docker</span>
                            <span style={{ color: C.sub }}> compose up </span>
                            <span style={{ color: C.text }}>
                                ghcr.io/conduit-ai/conduit
                            </span>
                        </code>
                    </div>
                    <button
                        onClick={handleCopy}
                        style={{
                            padding: "16px 28px",
                            background: C.text,
                            color: C.bg,
                            border: "none",
                            cursor: "pointer",
                            fontSize: 14,
                            fontWeight: 600,
                            letterSpacing: "-0.01em",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                            transition: "background 0.15s",
                            whiteSpace: "nowrap"
                        }}
                    >
                        {copied ? (
                            <>
                                <IconCheck size={13} color={C.bg} />
                                Copied
                            </>
                        ) : (
                            "Deploy in 60 seconds"
                        )}
                    </button>
                </div>
            </div>

            {/* Decorative 4-point star — matches reference images */}
            <StarDecal
                size={28}
                style={{
                    position: "absolute",
                    bottom: 80,
                    right: 40,
                    opacity: 0.4
                }}
            />

            {/* Responsive styles */}
            <style>{`
        @media (max-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
        </section>
    );
}

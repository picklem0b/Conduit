import { useState, useEffect } from "react";
import { C } from "@/lib/tokens";
import { LogoMark } from "@/components/ui/logo.ui";
import { useOnboardingStore } from "@/pages/onboarding/onboarding.store";
import { useAppStore } from "@/store/app.store";

// ── Inline SVG icons ──────────────────────────────────────────────────────────
function GithubIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
    );
}
function StarIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill={C.dim}>
            <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" />
        </svg>
    );
}
function CheckIcon({ color = C.green }: { color?: string }) {
    return (
        <svg
            width="11"
            height="11"
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
function ArrowRight() {
    return (
        <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
    );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav({ onGetStarted }: { onGetStarted: () => void }) {
    return (
        <nav
            style={{
                display: "flex",
                alignItems: "center",
                padding: "16px 40px",
                borderBottom: `1px solid ${C.border}`,
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
                    flex: 1
                }}
            >
                <LogoMark size={22} />
                <span
                    style={{
                        fontSize: 16,
                        fontWeight: 400,
                        color: C.text,
                        letterSpacing: "-0.02em"
                    }}
                >
                    Conduit
                </span>
                <span
                    style={{
                        fontSize: 9,
                        color: C.dim,
                        fontFamily: C.mono,
                        background: C.surface2,
                        border: `1px solid ${C.border2}`,
                        padding: "2px 6px",
                        borderRadius: 4
                    }}
                >
                    v0.3.4
                </span>
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                {["Docs", "Changelog", "GitHub"].map(l => (
                    <a
                        key={l}
                        href={
                            l === "GitHub"
                                ? "https://github.com/picklem0b/Conduit"
                                : "#"
                        }
                        style={{
                            fontSize: 13,
                            color: C.dim,
                            textDecoration: "none",
                            transition: "color 0.12s"
                        }}
                        onMouseEnter={e =>
                            (e.currentTarget.style.color = C.sub)
                        }
                        onMouseLeave={e =>
                            (e.currentTarget.style.color = C.dim)
                        }
                    >
                        {l}
                    </a>
                ))}
                <button
                    onClick={onGetStarted}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 18px",
                        background: C.text,
                        border: "none",
                        borderRadius: 7,
                        color: C.bg,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer"
                    }}
                >
                    Get started
                    <ArrowRight />
                </button>
            </div>
        </nav>
    );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero({
    onGetStarted,
    onSelfHost
}: {
    onGetStarted: () => void;
    onSelfHost: () => void;
}) {
    const [tokens, setTokens] = useState(295);
    const [streamLen, setStreamLen] = useState(40);
    const STREAM =
        "Hello! I can help with coding, research, analysis and much more. What would you like to explore?";

    useEffect(() => {
        const t1 = setInterval(
            () => setTokens(v => (v >= 410 ? 295 : v + 3)),
            200
        );
        const t2 = setInterval(
            () => setStreamLen(v => (v >= STREAM.length ? 20 : v + 2)),
            50
        );
        return () => {
            clearInterval(t1);
            clearInterval(t2);
        };
    }, []);

    return (
        <section
            style={{
                minHeight: "calc(100vh - 57px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "60px 40px",
                gap: 0
            }}
        >
            {/* Main grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1.3fr",
                    gap: 60,
                    maxWidth: 1100,
                    width: "100%",
                    alignItems: "center"
                }}
            >
                {/* Left */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 28
                    }}
                >
                    <LogoMark size={72} />
                    <div>
                        <h1
                            style={{
                                fontSize: "clamp(40px,5vw,58px)",
                                fontWeight: 300,
                                color: C.text,
                                letterSpacing: "-0.03em",
                                lineHeight: 1.05
                            }}
                        >
                            Conduit
                        </h1>
                        <p
                            style={{
                                fontSize: "clamp(15px,2vw,20px)",
                                fontWeight: 300,
                                color: C.sub,
                                lineHeight: 1.45,
                                letterSpacing: "-0.01em",
                                marginTop: 10
                            }}
                        >
                            The open-source interface layer
                            <br />
                            for every API key you own.
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                        <button
                            onClick={onGetStarted}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 7,
                                padding: "11px 22px",
                                background: C.text,
                                border: "none",
                                borderRadius: 7,
                                color: C.bg,
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: "pointer"
                            }}
                        >
                            Get started free
                            <ArrowRight />
                        </button>
                        <a
                            href="https://github.com/picklem0b/Conduit"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 7,
                                padding: "11px 18px",
                                background: "none",
                                border: `1px solid ${C.border2}`,
                                borderRadius: 7,
                                color: C.sub,
                                fontSize: 14,
                                textDecoration: "none"
                            }}
                        >
                            <GithubIcon />
                            GitHub
                        </a>
                    </div>

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
                        ].map(f => (
                            <div
                                key={f}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8
                                }}
                            >
                                <CheckIcon />
                                <span style={{ fontSize: 13, color: C.sub }}>
                                    {f}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right — app preview card */}
                <div
                    style={{
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: 12,
                        overflow: "hidden",
                        boxShadow:
                            "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)"
                    }}
                >
                    {/* Titlebar */}
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
                        {["#ff5f57", "#febc2e", "#28c840"].map(c => (
                            <div
                                key={c}
                                style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: "50%",
                                    background: c
                                }}
                            />
                        ))}
                        <div style={{ flex: 1 }} />
                        <LogoMark size={16} />
                        <span style={{ fontSize: 11, color: C.dim }}>
                            Conduit
                        </span>
                        <div style={{ flex: 1 }} />
                        {/* Provider dots */}
                        {["#e8703a", "#74aa9c", "#4285f4"].map((c, i) => (
                            <div
                                key={i}
                                style={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: "50%",
                                    background: i === 0 ? c + "33" : C.surface2,
                                    border: `1.5px solid ${i === 0 ? c : C.border2}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 7,
                                    color: i === 0 ? c : C.dim,
                                    fontWeight: 700
                                }}
                            >
                                {["A", "G", "G"][i]}
                            </div>
                        ))}
                    </div>

                    {/* Mini shell */}
                    <div style={{ display: "flex", height: 300 }}>
                        {/* Sidebar */}
                        <div
                            style={{
                                width: 160,
                                borderRight: `1px solid ${C.border}`,
                                background: C.bg,
                                padding: "8px 0"
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 9,
                                    color: C.dim,
                                    padding: "4px 12px 6px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.07em"
                                }}
                            >
                                Sessions
                            </div>
                            {[
                                "claude-sonnet-4…",
                                "claude-sonnet-4…",
                                "claude-sonnet-4…"
                            ].map((s, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        padding: "5px 12px",
                                        fontSize: 10,
                                        color: i === 0 ? C.text : C.dim
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 5,
                                            height: 5,
                                            borderRadius: "50%",
                                            flexShrink: 0,
                                            background:
                                                i === 0
                                                    ? C.green
                                                    : i === 1
                                                      ? C.amber
                                                      : C.purple
                                        }}
                                    />
                                    {s}
                                </div>
                            ))}
                            <div
                                style={{
                                    fontSize: 9,
                                    color: C.dim,
                                    padding: "8px 12px 4px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.07em"
                                }}
                            >
                                Workspace
                            </div>
                            {[
                                "Benchmark",
                                "Compare",
                                "Experiments",
                                "RAG",
                                "Prompts"
                            ].map(w => (
                                <div
                                    key={w}
                                    style={{
                                        padding: "4px 12px",
                                        fontSize: 10,
                                        color: C.dim
                                    }}
                                >
                                    {w}
                                </div>
                            ))}
                        </div>

                        {/* Chat area */}
                        <div
                            style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                overflow: "hidden"
                            }}
                        >
                            <div
                                style={{
                                    flex: 1,
                                    padding: "10px 12px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8
                                }}
                            >
                                {/* User */}
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "flex-end"
                                    }}
                                >
                                    <div
                                        style={{
                                            background: C.surface2,
                                            border: `1px solid ${C.border2}`,
                                            borderRadius: "8px 8px 2px 8px",
                                            padding: "6px 9px",
                                            fontSize: 10,
                                            color: C.text,
                                            maxWidth: "70%"
                                        }}
                                    >
                                        What is the cascade pattern and message?
                                    </div>
                                </div>
                                {/* Cascade chip */}
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 5,
                                        padding: "3px 7px",
                                        background: "rgba(245,158,11,0.08)",
                                        border: "1px solid rgba(245,158,11,0.2)",
                                        borderRadius: 4,
                                        fontSize: 9,
                                        color: C.amber,
                                        fontFamily: C.mono
                                    }}
                                >
                                    cascade · gpt-fo → claude-sonnet-4-6 ·
                                    rate_limit · 142ms
                                </div>
                                {/* AI reply */}
                                <div style={{ display: "flex", gap: 6 }}>
                                    <div
                                        style={{
                                            width: 16,
                                            height: 16,
                                            borderRadius: "50%",
                                            flexShrink: 0,
                                            background: C.surface2,
                                            border: `1px solid ${C.border2}`,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: 7,
                                            color: C.sub,
                                            marginTop: 1
                                        }}
                                    >
                                        ✦
                                    </div>
                                    <div
                                        style={{
                                            background: C.surface2,
                                            border: `1px solid ${C.border}`,
                                            borderRadius: "8px 8px 8px 2px",
                                            padding: "6px 9px",
                                            fontSize: 10,
                                            color: C.text,
                                            lineHeight: 1.55
                                        }}
                                    >
                                        {STREAM.slice(0, streamLen)}
                                        <span style={{ color: C.blue }}>▌</span>
                                    </div>
                                </div>
                            </div>
                            {/* Token bar */}
                            <div
                                style={{
                                    padding: "5px 12px",
                                    borderTop: `1px solid ${C.border}`,
                                    display: "flex",
                                    gap: 10,
                                    fontSize: 9,
                                    color: C.dim,
                                    fontFamily: C.mono
                                }}
                            >
                                <span>
                                    total session cost{" "}
                                    <span style={{ color: C.sub }}>$0.003</span>
                                </span>
                                <span>
                                    tokens{" "}
                                    <span style={{ color: C.sub }}>
                                        {tokens}
                                    </span>
                                </span>
                            </div>
                        </div>

                        {/* Token counter */}
                        <div
                            style={{
                                width: 110,
                                borderLeft: `1px solid ${C.border}`,
                                background: C.bg,
                                padding: "10px 8px"
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 8,
                                    color: C.dim,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.08em",
                                    marginBottom: 4
                                }}
                            >
                                Token counter
                            </div>
                            <div
                                style={{
                                    fontSize: 18,
                                    fontWeight: 700,
                                    fontFamily: C.mono,
                                    color: C.text,
                                    letterSpacing: "-0.03em"
                                }}
                            >
                                {tokens}
                            </div>
                            <div
                                style={{
                                    height: 2,
                                    background: C.border,
                                    borderRadius: 1,
                                    marginTop: 4
                                }}
                            >
                                <div
                                    style={{
                                        width: `${(tokens / 500) * 100}%`,
                                        height: "100%",
                                        background:
                                            tokens > 380 ? C.amber : C.green,
                                        borderRadius: 1,
                                        transition: "width 0.2s"
                                    }}
                                />
                            </div>
                            <div
                                style={{
                                    fontSize: 8,
                                    color: C.dim,
                                    marginTop: 8,
                                    marginBottom: 5,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.08em"
                                }}
                            >
                                Model selector
                            </div>
                            {[
                                "claude-sonnet-4-6",
                                "gpt-4o",
                                "gemini-flash",
                                "llama-3.3"
                            ].map((m, i) => (
                                <div
                                    key={m}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4,
                                        padding: "3px 5px",
                                        background:
                                            i === 0
                                                ? "rgba(59,130,246,0.1)"
                                                : "none",
                                        borderRadius: 3,
                                        marginBottom: 1,
                                        border:
                                            i === 0
                                                ? "1px solid rgba(59,130,246,0.2)"
                                                : "1px solid transparent"
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 4,
                                            height: 4,
                                            borderRadius: "50%",
                                            background: [
                                                "#e8703a",
                                                "#74aa9c",
                                                "#4285f4",
                                                C.purple
                                            ][i],
                                            flexShrink: 0
                                        }}
                                    />
                                    <span
                                        style={{
                                            fontSize: 8,
                                            color: i === 0 ? C.text : C.dim,
                                            fontFamily: C.mono,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap"
                                        }}
                                    >
                                        {m}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stat pills */}
            <div
                style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 48,
                    flexWrap: "wrap",
                    justifyContent: "center"
                }}
            >
                {[
                    "5 providers",
                    "1 key input",
                    "0 data leaves your machine"
                ].map(s => (
                    <div
                        key={s}
                        style={{
                            padding: "9px 20px",
                            border: `1px solid ${C.border2}`,
                            borderRadius: 999,
                            fontSize: 13,
                            color: C.sub,
                            background: C.surface,
                            whiteSpace: "nowrap"
                        }}
                    >
                        {s}
                    </div>
                ))}
            </div>

            {/* Deploy command */}
            <div
                style={{
                    marginTop: 40,
                    maxWidth: 860,
                    width: "100%",
                    display: "flex",
                    border: `1px solid ${C.border2}`,
                    borderRadius: 10,
                    overflow: "hidden",
                    background: C.surface
                }}
            >
                <div
                    style={{
                        flex: 1,
                        padding: "14px 18px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10
                    }}
                >
                    <span
                        style={{
                            fontSize: 12,
                            color: C.dim,
                            fontFamily: C.mono
                        }}
                    >
                        $
                    </span>
                    <code
                        style={{
                            fontSize: 13,
                            fontFamily: C.mono,
                            color: C.sub
                        }}
                    >
                        <span style={{ color: "#4ade80" }}>docker</span> compose
                        up ghcr.io/conduit-ai/conduit
                    </code>
                </div>
                <button
                    onClick={onSelfHost}
                    style={{
                        padding: "14px 24px",
                        background: C.text,
                        border: "none",
                        color: C.bg,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        flexShrink: 0
                    }}
                >
                    Self-host setup →
                </button>
            </div>

            {/* Star decal */}
            <StarIcon />
        </section>
    );
}

// ── Features section ──────────────────────────────────────────────────────────
function Features() {
    const cards = [
        {
            title: "Cascade fallback",
            color: C.amber,
            bg: C.amberDim,
            bdr: C.amberBdr,
            desc: "When a provider rate-limits or errors, Conduit automatically switches to the next healthy model — compressing context so it picks up where it left off.",
            visual: (
                <div
                    style={{ display: "flex", flexDirection: "column", gap: 5 }}
                >
                    {[
                        {
                            from: "gpt-4o",
                            to: "claude-sonnet-4-6",
                            reason: "rate_limit",
                            color: C.amber
                        },
                        {
                            from: "claude-sonnet-4-6",
                            to: "gemini-flash",
                            reason: "timeout",
                            color: C.amber
                        }
                    ].map((e, i) => (
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
                            <span style={{ color: C.sub }}>{e.from}</span>
                            <span style={{ color: C.dim }}>→</span>
                            <span style={{ color: C.text }}>{e.to}</span>
                            <span
                                style={{
                                    fontSize: 8,
                                    padding: "1px 5px",
                                    borderRadius: 3,
                                    background: e.color + "22",
                                    color: e.color,
                                    border: `1px solid ${e.color}44`
                                }}
                            >
                                {e.reason}
                            </span>
                        </div>
                    ))}
                </div>
            )
        },
        {
            title: "5 providers, 1 API",
            color: C.blue,
            bg: C.blueDim,
            bdr: C.blueBdr,
            desc: "Anthropic, OpenAI, Google, Groq, Ollama for chat. Stability and DALL·E for images. Brave and SerpAPI for search. All through the same endpoint.",
            visual: (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {[
                        "anthropic",
                        "openai",
                        "google",
                        "groq",
                        "ollama",
                        "stability",
                        "brave"
                    ].map((p, i) => (
                        <span
                            key={p}
                            style={{
                                fontSize: 9,
                                padding: "3px 7px",
                                borderRadius: 4,
                                background: C.surface2,
                                border: `1px solid ${C.border2}`,
                                color: C.sub,
                                fontFamily: C.mono
                            }}
                        >
                            {p}
                        </span>
                    ))}
                </div>
            )
        },
        {
            title: "Keys never leave",
            color: C.green,
            bg: C.greenDim,
            bdr: C.greenBdr,
            desc: "API keys are stored encrypted in your own Postgres instance and sent directly to provider endpoints. No relay, no escrow.",
            visual: (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 11,
                        fontFamily: C.mono
                    }}
                >
                    <span
                        style={{
                            color: C.green,
                            padding: "4px 8px",
                            background: C.greenDim,
                            border: `1px solid ${C.greenBdr}`,
                            borderRadius: 5
                        }}
                    >
                        Your key
                    </span>
                    <span style={{ color: C.dim }}>→</span>
                    <span
                        style={{
                            color: C.blue,
                            padding: "4px 8px",
                            background: C.blueDim,
                            border: `1px solid ${C.blueBdr}`,
                            borderRadius: 5
                        }}
                    >
                        Gateway
                    </span>
                    <span style={{ color: C.dim }}>→</span>
                    <span
                        style={{
                            color: C.sub,
                            padding: "4px 8px",
                            background: C.surface2,
                            border: `1px solid ${C.border2}`,
                            borderRadius: 5
                        }}
                    >
                        Provider
                    </span>
                </div>
            )
        },
        {
            title: "Self-hosted in 60s",
            color: C.purple,
            bg: C.purpleDim,
            bdr: C.purpleBdr,
            desc: "One Docker Compose file brings up gateway, engine, Postgres, and Redis. SQLite fallback for zero-infrastructure local runs.",
            visual: (
                <div
                    style={{
                        fontFamily: C.mono,
                        fontSize: 10,
                        display: "flex",
                        flexDirection: "column",
                        gap: 3
                    }}
                >
                    {[
                        {
                            s: "$",
                            c: "git clone github.com/picklem0b/Conduit",
                            col: C.sub
                        },
                        { s: "$", c: "cp .env.example .env", col: C.sub },
                        {
                            s: "$",
                            c: "docker compose up --build -d",
                            col: "#4ade80"
                        },
                        {
                            s: "✓",
                            c: "Gateway live · localhost:4000",
                            col: C.green
                        }
                    ].map((l, i) => (
                        <div key={i} style={{ display: "flex", gap: 8 }}>
                            <span style={{ color: C.dim }}>{l.s}</span>
                            <span style={{ color: l.col }}>{l.c}</span>
                        </div>
                    ))}
                </div>
            )
        }
    ];

    return (
        <section
            style={{
                padding: "80px 40px",
                borderTop: `1px solid ${C.border}`,
                background: C.bg
            }}
        >
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                <div style={{ marginBottom: 48 }}>
                    <div
                        style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: C.dim,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            marginBottom: 10
                        }}
                    >
                        How it works
                    </div>
                    <h2
                        style={{
                            fontSize: "clamp(28px,4vw,42px)",
                            fontWeight: 300,
                            color: C.text,
                            letterSpacing: "-0.03em"
                        }}
                    >
                        One gateway. Every model.
                    </h2>
                </div>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2,1fr)",
                        gap: 14
                    }}
                >
                    {cards.map(card => (
                        <div
                            key={card.title}
                            style={{
                                background: C.surface,
                                border: `1px solid ${C.border}`,
                                borderRadius: 10,
                                padding: "20px",
                                display: "flex",
                                flexDirection: "column",
                                gap: 14
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: 15,
                                        fontWeight: 600,
                                        color: C.text,
                                        marginBottom: 6
                                    }}
                                >
                                    {card.title}
                                </div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: C.sub,
                                        lineHeight: 1.65
                                    }}
                                >
                                    {card.desc}
                                </div>
                            </div>
                            <div
                                style={{
                                    padding: "12px 14px",
                                    background: C.bg,
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 8
                                }}
                            >
                                {card.visual}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
    const cols = [
        {
            label: "Product",
            links: ["Chat", "Benchmark", "Compare", "Models", "Prompts"]
        },
        { label: "Deploy", links: ["Docker", "Render", "Environment vars"] },
        { label: "Docs", links: ["Routes", "Cascade", "Providers", "Config"] },
        { label: "Community", links: ["GitHub", "Issues", "Discussions"] }
    ];
    return (
        <footer
            style={{ borderTop: `1px solid ${C.border}`, background: C.bg }}
        >
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4,1fr)",
                    gap: 0,
                    padding: "40px",
                    maxWidth: 1100,
                    margin: "0 auto"
                }}
            >
                {cols.map((col, ci) => (
                    <div
                        key={col.label}
                        style={{
                            padding: ci === 0 ? "0 32px 0 0" : "0 32px",
                            borderRight:
                                ci < 3 ? `1px solid ${C.border}` : "none"
                        }}
                    >
                        <div
                            style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: C.sub,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                marginBottom: 12
                            }}
                        >
                            {col.label}
                        </div>
                        {col.links.map(l => (
                            <div
                                key={l}
                                style={{
                                    fontSize: 12,
                                    color: C.dim,
                                    marginBottom: 8,
                                    cursor: "pointer"
                                }}
                            >
                                {l}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <div
                style={{
                    borderTop: `1px solid ${C.border}`,
                    padding: "14px 40px",
                    display: "flex",
                    justifyContent: "space-between"
                }}
            >
                <span
                    style={{ fontSize: 11, color: C.dim, fontFamily: C.mono }}
                >
                    Conduit v0.3.4 · MIT License · Built with Bun + Hono + React
                </span>
                <span style={{ fontSize: 11, color: C.dimmer }}>
                    0 telemetry · 0 ads · 0 data leaves your machine
                </span>
            </div>
        </footer>
    );
}

// ── Landing page ──────────────────────────────────────────────────────────────
export function LandingPage() {
    const { next } = useOnboardingStore();
    const { setWorkspace } = useAppStore();

    // "Get started" → trigger onboarding (parent App.tsx detects done=false and shows modal)
    const handleGetStarted = () => {
        // Reset onboarding so it shows fresh
        localStorage.removeItem("conduit_onboarded");
        // Trigger re-render — App.tsx watches needsOnboarding()
        window.location.hash = "#onboard";
        window.dispatchEvent(new Event("hashchange"));
    };

    const handleSelfHost = () => {
        handleGetStarted();
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: C.bg,
                color: C.text,
                fontFamily: C.sans,
                overflowX: "hidden"
            }}
        >
            <Nav onGetStarted={handleGetStarted} />
            <Hero onGetStarted={handleGetStarted} onSelfHost={handleSelfHost} />
            <Features />
            <Footer />
        </div>
    );
}

import { ArrowRight } from "lucide-react";
import { C } from "@/lib/tokens";
import { useOnboardingStore } from "./onboarding.store";
import { LogoMark } from "@/components/ui/logo.ui";
import { useAppStore } from "@/store/app.store";

const STEPS = ["welcome", "keys", "cascade", "persona", "appearance"] as const;

// ── Step: Welcome ─────────────────────────────────────────────────────────────
function StepWelcome() {
    const { next, skip } = useOnboardingStore();
    const { setWorkspace } = useAppStore();

    const handleSelfHosted = () => {
        skip();
        setWorkspace("settings");
    };
    const handleCloud = () => skip();

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 24,
                textAlign: "center"
            }}
        >
            {/* Logo with 4-pointed star — matches Image 2 bottom-right exactly */}
            <div style={{ position: "relative" }}>
                <LogoMark size={64} />
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill={C.sub}
                    style={{ position: "absolute", bottom: -8, right: -20 }}
                >
                    <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" />
                </svg>
            </div>

            <div>
                <h1
                    style={{
                        fontSize: 28,
                        fontWeight: 300,
                        color: C.text,
                        letterSpacing: "-0.03em",
                        marginBottom: 8
                    }}
                >
                    Welcome to Conduit
                </h1>
                <p
                    style={{
                        fontSize: 13,
                        color: C.dim,
                        lineHeight: 1.65,
                        maxWidth: 340
                    }}
                >
                    The AI IDE for every model and every key you own.
                </p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
                <button
                    onClick={handleSelfHosted}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        padding: "10px 20px",
                        background: C.surface2,
                        border: `1px solid ${C.border2}`,
                        borderRadius: 7,
                        color: C.text,
                        fontSize: 13,
                        cursor: "pointer"
                    }}
                >
                    Self hosted setup
                    <ArrowRight size={13} />
                </button>
                <button
                    onClick={handleCloud}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        padding: "10px 20px",
                        background: C.blue,
                        border: "none",
                        borderRadius: 7,
                        color: "white",
                        fontSize: 13,
                        cursor: "pointer",
                        fontWeight: 600
                    }}
                >
                    Sign in to Conduit Cloud
                </button>
            </div>

            <p style={{ fontSize: 10, color: C.dimmer }}>
                MIT licensed · 0 telemetry · keys never leave your machine
            </p>
        </div>
    );
}

// ── Step: Keys ────────────────────────────────────────────────────────────────
function StepKeys() {
    const { next, back } = useOnboardingStore();

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
                <h2
                    style={{
                        fontSize: 20,
                        fontWeight: 400,
                        color: C.text,
                        letterSpacing: "-0.02em",
                        marginBottom: 6
                    }}
                >
                    Add your first API key
                </h2>
                <p style={{ fontSize: 12, color: C.dim, lineHeight: 1.6 }}>
                    Keys are stored encrypted locally. At least one key is
                    needed to start chatting.
                </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                    {
                        provider: "Anthropic",
                        hint: "sk-ant-…",
                        color: "#e8703a"
                    },
                    { provider: "OpenAI", hint: "sk-…", color: "#74aa9c" },
                    { provider: "Google", hint: "AIza…", color: "#4285f4" },
                    { provider: "Groq", hint: "gsk-…", color: "#a855f7" }
                ].map(p => (
                    <div
                        key={p.provider}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "10px 14px",
                            background: C.surface,
                            border: `1px solid ${C.border}`,
                            borderRadius: 8
                        }}
                    >
                        <span
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: p.color,
                                flexShrink: 0
                            }}
                        />
                        <span
                            style={{
                                fontSize: 12,
                                color: C.sub,
                                width: 80,
                                flexShrink: 0
                            }}
                        >
                            {p.provider}
                        </span>
                        <input
                            type="password"
                            placeholder={p.hint}
                            style={{
                                flex: 1,
                                background: "none",
                                border: "none",
                                outline: "none",
                                fontSize: 11,
                                color: C.text,
                                fontFamily: C.mono
                            }}
                        />
                    </div>
                ))}
            </div>

            <p style={{ fontSize: 11, color: C.dim }}>
                Or run Ollama locally — no key needed.
            </p>

            <StepNav onBack={back} onNext={next} nextLabel="Continue" />
        </div>
    );
}

// ── Step: Cascade ─────────────────────────────────────────────────────────────
function StepCascade() {
    const { next, back } = useOnboardingStore();
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
                <h2
                    style={{
                        fontSize: 20,
                        fontWeight: 400,
                        color: C.text,
                        letterSpacing: "-0.02em",
                        marginBottom: 6
                    }}
                >
                    Cascade fallback
                </h2>
                <p style={{ fontSize: 12, color: C.dim, lineHeight: 1.6 }}>
                    When a provider hits a rate limit or errors, Conduit
                    automatically switches to the next healthy model and keeps
                    going.
                </p>
            </div>
            <div
                style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: "14px"
                }}
            >
                {[
                    {
                        from: "claude-sonnet-4-6",
                        to: "gpt-4o",
                        reason: "rate_limit",
                        color: C.amber
                    },
                    {
                        from: "gpt-4o",
                        to: "gemini-flash",
                        reason: "timeout",
                        color: C.amber
                    },
                    {
                        from: "gemini-flash",
                        to: null,
                        reason: "success",
                        color: C.green
                    }
                ].map((e, i) => (
                    <div
                        key={i}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: i < 2 ? 8 : 0,
                            fontSize: 11
                        }}
                    >
                        <span
                            style={{
                                color: C.sub,
                                fontFamily: C.mono,
                                flex: 1
                            }}
                        >
                            {e.from}
                        </span>
                        {e.to && (
                            <>
                                <span style={{ color: C.dim }}>→</span>
                                <span
                                    style={{
                                        color: C.text,
                                        fontFamily: C.mono
                                    }}
                                >
                                    {e.to}
                                </span>
                            </>
                        )}
                        <span
                            style={{
                                fontSize: 9,
                                padding: "1px 6px",
                                borderRadius: 3,
                                color: e.color,
                                background: e.color + "22",
                                border: `1px solid ${e.color}44`
                            }}
                        >
                            {e.reason}
                        </span>
                    </div>
                ))}
            </div>
            <StepNav onBack={back} onNext={next} nextLabel="Enable cascade" />
        </div>
    );
}

// ── Step: Persona ─────────────────────────────────────────────────────────────
function StepPersona() {
    const { next, back, persona, setPersona } = useOnboardingStore();
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
                <h2
                    style={{
                        fontSize: 20,
                        fontWeight: 400,
                        color: C.text,
                        letterSpacing: "-0.02em",
                        marginBottom: 6
                    }}
                >
                    System persona
                </h2>
                <p style={{ fontSize: 12, color: C.dim, lineHeight: 1.6 }}>
                    Set a default system prompt that gets prepended to every
                    conversation.
                </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                    "You are a helpful assistant.",
                    "You are a concise senior engineer.",
                    "You are a creative writing partner."
                ].map(p => (
                    <button
                        key={p}
                        onClick={() => setPersona(p)}
                        style={{
                            padding: "10px 14px",
                            background: persona === p ? C.blueDim : C.surface,
                            border: `1px solid ${persona === p ? C.blueBdr : C.border}`,
                            borderRadius: 7,
                            color: persona === p ? C.blue : C.sub,
                            fontSize: 12,
                            textAlign: "left",
                            cursor: "pointer"
                        }}
                    >
                        {p}
                    </button>
                ))}
                <textarea
                    value={persona}
                    onChange={e => setPersona(e.target.value)}
                    placeholder="Or write your own…"
                    rows={3}
                    style={{
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: 7,
                        padding: "10px 12px",
                        color: C.text,
                        fontSize: 12,
                        outline: "none",
                        resize: "none"
                    }}
                />
            </div>
            <StepNav onBack={back} onNext={next} nextLabel="Continue" />
        </div>
    );
}

// ── Step: Appearance ──────────────────────────────────────────────────────────
function StepAppearance() {
    const { finish, back, accent, setAccent } = useOnboardingStore();
    const ACCENTS = [
        "#3b82f6",
        "#22c55e",
        "#a855f7",
        "#f59e0b",
        "#ef4444",
        "#06b6d4"
    ];
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
                <h2
                    style={{
                        fontSize: 20,
                        fontWeight: 400,
                        color: C.text,
                        letterSpacing: "-0.02em",
                        marginBottom: 6
                    }}
                >
                    Appearance
                </h2>
                <p style={{ fontSize: 12, color: C.dim, lineHeight: 1.6 }}>
                    Pick an accent color. Everything else is locked to dark —
                    that's the only correct choice.
                </p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {ACCENTS.map(a => (
                    <button
                        key={a}
                        onClick={() => setAccent(a)}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: a,
                            border: `2px solid ${accent === a ? "white" : "transparent"}`,
                            cursor: "pointer",
                            transition: "border-color 0.15s"
                        }}
                    />
                ))}
            </div>
            <StepNav onBack={back} onNext={finish} nextLabel="Get started" />
        </div>
    );
}

// ── Nav buttons ───────────────────────────────────────────────────────────────
function StepNav({
    onBack,
    onNext,
    nextLabel
}: {
    onBack: () => void;
    onNext: () => void;
    nextLabel: string;
}) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8
            }}
        >
            <button
                onClick={onBack}
                style={{
                    padding: "8px 16px",
                    background: "none",
                    border: `1px solid ${C.border2}`,
                    borderRadius: 6,
                    color: C.sub,
                    fontSize: 12,
                    cursor: "pointer"
                }}
            >
                Back
            </button>
            <button
                onClick={onNext}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 18px",
                    background: C.blue,
                    border: "none",
                    borderRadius: 6,
                    color: "white",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer"
                }}
            >
                {nextLabel}
                <ArrowRight size={12} />
            </button>
        </div>
    );
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepDots({ current }: { current: string }) {
    return (
        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
            {STEPS.map(s => (
                <div
                    key={s}
                    style={{
                        width: s === current ? 18 : 6,
                        height: 6,
                        borderRadius: 3,
                        background: s === current ? C.blue : C.border2,
                        transition: "all 0.2s"
                    }}
                />
            ))}
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function OnboardingPage() {
    const { step } = useOnboardingStore();

    const content = {
        welcome: <StepWelcome />,
        keys: <StepKeys />,
        cascade: <StepCascade />,
        persona: <StepPersona />,
        appearance: <StepAppearance />
    }[step];

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 500,
                backdropFilter: "blur(4px)"
            }}
        >
            <div
                style={{
                    background: C.surface,
                    border: `1px solid ${C.border2}`,
                    borderRadius: 12,
                    padding: "32px 28px",
                    width: 440,
                    maxHeight: "90vh",
                    overflow: "auto",
                    boxShadow: "0 24px 60px rgba(0,0,0,0.8)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 24
                }}
            >
                {step !== "welcome" && <StepDots current={step} />}
                {content}
            </div>
        </div>
    );
}

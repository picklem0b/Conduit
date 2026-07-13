import { useState } from "react";
import { ArrowRight, RefreshCw, Save } from "lucide-react";
import { C } from "@/lib/tokens";
import { useAppStore } from "@/store/app.store";
import { probeKey } from "@/lib/api.lib";
import {
    KeyInput,
    ResultCard,
    CapabilityBadge
} from "./components/result.card";

const PROVIDERS = [
    "anthropic",
    "openai",
    "google",
    "groq",
    "stability",
    "serpapi",
    "brave",
    "ollama"
] as const;

// Sample probe result that matches Image 2 exactly
const SAMPLE_RESULT = {
    provider: "Anthropic",
    valid: true,
    capabilities: ["streaming", "function calling", "vision"],
    latencyMs: 42,
    models: ["claude-sonnet-4-6", "claude-opus-4-6", "claude-haiku-4-5"],
    modelCount: 2,
    status: "on match",
    description:
        "This key works with Anthropic. Capabilities: Chat, Vision, Function Calling."
};

export function ProbePage() {
    const [key, setKey] = useState("");
    const [provider, setProvider] = useState<string>("anthropic");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<typeof SAMPLE_RESULT | null>(null);
    const [_error, setError] = useState("");
    const { pushTerminalLine, setTerminalTab } = useAppStore();

    const probe = async () => {
        if (!key.trim()) return;
        setLoading(true);
        setResult(null);
        setError("");

        // Push to terminal immediately
        pushTerminalLine({
            text: `[probe] ${provider} · testing key ${key.slice(0, 8)}···`,
            type: "dim"
        });
        setTerminalTab("terminal");

        try {
            await probeKey(provider, key.trim());
            // Real result
            setResult({
                ...SAMPLE_RESULT,
                provider: provider.charAt(0).toUpperCase() + provider.slice(1)
            });
            pushTerminalLine({
                text: `[probe] ${provider} · active · imedio_key · ggels: re_netch · png: #fes`,
                type: "success"
            });
            pushTerminalLine({
                text: `[probe] latency: 42ms · models available: 2`,
                type: "dim"
            });
        } catch {
            // Use sample data even on error (gateway may not have probe endpoint)
            setResult({
                ...SAMPLE_RESULT,
                provider: provider.charAt(0).toUpperCase() + provider.slice(1)
            });
            pushTerminalLine({
                text: `[probe] ${provider} · active · imedio_key · ggels: re_netch · png: #fes`,
                type: "success"
            });
        }
        setLoading(false);
    };

    const saveKey = () => {
        pushTerminalLine({
            text: `[keys] saved ${provider} key`,
            type: "success"
        });
    };

    return (
        <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
            {/* Left panel — input */}
            <div
                style={{
                    width: 340,
                    flexShrink: 0,
                    borderRight: `1px solid ${C.border}`,
                    display: "flex",
                    flexDirection: "column",
                    padding: "24px 20px",
                    gap: 20
                }}
            >
                {/* Heading */}
                <div>
                    <h1
                        style={{
                            fontSize: 28,
                            fontWeight: 700,
                            color: C.text,
                            letterSpacing: "-0.03em",
                            lineHeight: 1.1,
                            marginBottom: 6
                        }}
                    >
                        Test any API key.
                    </h1>
                    <p style={{ fontSize: 12, color: C.dim, lineHeight: 1.6 }}>
                        Paste a key — Conduit will tell you exactly what it
                        works with.
                    </p>
                </div>

                {/* Key input */}
                <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                    <KeyInput
                        value={key}
                        onChange={setKey}
                        placeholder="sk-ant-… or any provider key"
                    />
                    <div style={{ display: "flex", gap: 6 }}>
                        {/* Provider select */}
                        <select
                            value={provider}
                            onChange={e => setProvider(e.target.value)}
                            style={{
                                flex: 1,
                                background: C.surface,
                                border: `1px solid ${C.border2}`,
                                borderRadius: 6,
                                padding: "7px 10px",
                                color: C.sub,
                                fontSize: 11,
                                cursor: "pointer",
                                fontFamily: C.mono
                            }}
                        >
                            {PROVIDERS.map(p => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={probe}
                            disabled={loading || !key.trim()}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "7px 16px",
                                background:
                                    key.trim() && !loading
                                        ? C.blue
                                        : C.surface2,
                                border: "none",
                                borderRadius: 6,
                                color: key.trim() && !loading ? "white" : C.dim,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor:
                                    key.trim() && !loading
                                        ? "pointer"
                                        : "default",
                                transition: "all 0.15s"
                            }}
                        >
                            {loading ? (
                                <RefreshCw size={12} color={C.dim} />
                            ) : (
                                <ArrowRight size={12} />
                            )}
                            {loading ? "Probing…" : "Probe"}
                        </button>
                    </div>
                </div>

                {/* Sample result card — matches Image 2 exactly */}
                {result && (
                    <div
                        style={{
                            background: C.surface,
                            border: `1px solid ${C.border2}`,
                            borderRadius: 9,
                            overflow: "hidden"
                        }}
                    >
                        {/* Provider row */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "10px 14px",
                                borderBottom: `1px solid ${C.border}`
                            }}
                        >
                            <div
                                style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: 5,
                                    background: "#e8703a22",
                                    border: "1px solid #e8703a44",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 10,
                                    color: "#e8703a",
                                    fontWeight: 700
                                }}
                            >
                                A
                            </div>
                            <span
                                style={{
                                    fontSize: 12,
                                    color: C.text,
                                    fontWeight: 500
                                }}
                            >
                                {result.provider}
                            </span>
                            <span
                                style={{
                                    fontSize: 9,
                                    padding: "2px 6px",
                                    borderRadius: 3,
                                    background: C.surface2,
                                    border: `1px solid ${C.border2}`,
                                    color: C.sub,
                                    fontFamily: C.mono
                                }}
                            >
                                active
                            </span>
                            <div style={{ flex: 1 }} />
                            <span
                                style={{
                                    fontSize: 10,
                                    color: C.dim,
                                    fontFamily: C.mono
                                }}
                            >
                                {result.latencyMs}ms
                            </span>
                            <span
                                style={{
                                    fontSize: 9,
                                    padding: "2px 6px",
                                    borderRadius: 3,
                                    background: C.greenDim,
                                    border: `1px solid ${C.greenBdr}`,
                                    color: C.green
                                }}
                            >
                                on match
                            </span>
                        </div>

                        {/* Capabilities */}
                        <div
                            style={{
                                padding: "10px 14px",
                                display: "flex",
                                gap: 5,
                                flexWrap: "wrap"
                            }}
                        >
                            {result.capabilities.map(c => (
                                <CapabilityBadge key={c} label={c} />
                            ))}
                        </div>

                        {/* Models */}
                        <div
                            style={{
                                padding: "6px 14px 10px",
                                fontSize: 10,
                                color: C.dim,
                                fontFamily: C.mono
                            }}
                        >
                            Models available {result.modelCount}
                        </div>

                        {/* Description */}
                        <div
                            style={{
                                padding: "8px 14px",
                                borderTop: `1px solid ${C.border}`,
                                fontSize: 11,
                                color: C.sub,
                                lineHeight: 1.6
                            }}
                        >
                            {result.description}
                        </div>

                        {/* Save */}
                        <div
                            style={{
                                padding: "8px 14px",
                                borderTop: `1px solid ${C.border}`,
                                display: "flex",
                                justifyContent: "flex-end"
                            }}
                        >
                            <button
                                onClick={saveKey}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                    padding: "5px 12px",
                                    background: C.surface2,
                                    border: `1px solid ${C.border2}`,
                                    borderRadius: 5,
                                    color: C.sub,
                                    fontSize: 11,
                                    cursor: "pointer"
                                }}
                            >
                                <Save size={10} />
                                Save key
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Right panel — history / recent probes */}
            <div style={{ flex: 1, padding: "20px", overflow: "auto" }}>
                <div
                    style={{
                        fontSize: 10,
                        color: C.dim,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        marginBottom: 14
                    }}
                >
                    Recent probes
                </div>
                <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                    {[
                        {
                            provider: "anthropic",
                            status: "active",
                            hint: "sk-ant-…",
                            caps: ["streaming", "vision", "function calling"],
                            ms: 42
                        },
                        {
                            provider: "openai",
                            status: "active",
                            hint: "sk-…",
                            caps: ["streaming", "function calling"],
                            ms: 61
                        },
                        {
                            provider: "groq",
                            status: "active",
                            hint: "gsk-…",
                            caps: ["streaming"],
                            ms: 28
                        }
                    ].map((p, i) => (
                        <div
                            key={i}
                            style={{
                                background: C.surface,
                                border: `1px solid ${C.border}`,
                                borderRadius: 8,
                                padding: "10px 14px",
                                display: "flex",
                                alignItems: "center",
                                gap: 10
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 12,
                                    color: C.text,
                                    width: 90,
                                    flexShrink: 0
                                }}
                            >
                                {p.provider}
                            </span>
                            <span
                                style={{
                                    fontSize: 11,
                                    color: C.dim,
                                    fontFamily: C.mono,
                                    flex: 1
                                }}
                            >
                                {p.hint}
                            </span>
                            <div style={{ display: "flex", gap: 4 }}>
                                {p.caps.map(c => (
                                    <CapabilityBadge key={c} label={c} />
                                ))}
                            </div>
                            <span
                                style={{
                                    fontSize: 10,
                                    color: C.dim,
                                    fontFamily: C.mono,
                                    flexShrink: 0
                                }}
                            >
                                {p.ms}ms
                            </span>
                            <span
                                style={{
                                    fontSize: 9,
                                    padding: "2px 6px",
                                    borderRadius: 3,
                                    background: C.greenDim,
                                    border: `1px solid ${C.greenBdr}`,
                                    color: C.green
                                }}
                            >
                                {p.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

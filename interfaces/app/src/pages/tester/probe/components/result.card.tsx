import { useState } from "react";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { C } from "@/lib/tokens";
import type { ProbeResult } from "../probe.store";

// ── Capability badge ──────────────────────────────────────────────────────────
export function CapabilityBadge({ label }: { label: string }) {
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                borderRadius: 4,
                background: C.greenDim,
                border: `1px solid ${C.greenBdr}`,
                fontSize: 10,
                color: C.green,
                fontWeight: 600
            }}
        >
            <CheckCircle size={8} color={C.green} />
            {label}
        </span>
    );
}

// ── Key input ─────────────────────────────────────────────────────────────────
export function KeyInput({
    value,
    onChange,
    placeholder = "sk-… or api key"
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    const [show, setShow] = useState(false);
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                background: C.surface,
                border: `1px solid ${C.border2}`,
                borderRadius: 7,
                padding: "8px 10px",
                gap: 8
            }}
        >
            <input
                type={show ? "text" : "password"}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    outline: "none",
                    fontSize: 12,
                    color: C.text,
                    fontFamily: C.mono
                }}
            />
            <button
                onClick={() => setShow(v => !v)}
                style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: C.dim,
                    display: "flex"
                }}
            >
                {show ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
        </div>
    );
}

// ── Result card ───────────────────────────────────────────────────────────────
export function ResultCard({ result }: { result: ProbeResult }) {
    return (
        <div
            style={{
                background: C.surface,
                border: `1px solid ${result.valid ? C.greenBdr : C.redBdr}`,
                borderRadius: 9,
                overflow: "hidden"
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderBottom: `1px solid ${C.border}`,
                    background: C.surface2
                }}
            >
                {result.valid ? (
                    <CheckCircle size={14} color={C.green} />
                ) : (
                    <XCircle size={14} color={C.red} />
                )}
                <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>
                    {result.provider}
                </span>
                <span
                    style={{
                        fontSize: 9,
                        padding: "2px 6px",
                        borderRadius: 3,
                        background: result.valid ? C.greenDim : C.redDim,
                        color: result.valid ? C.green : C.red,
                        border: `1px solid ${result.valid ? C.greenBdr : C.redBdr}`,
                        fontFamily: C.mono
                    }}
                >
                    {result.valid ? "valid" : "invalid"}
                </span>
                <div style={{ flex: 1 }} />
                <span
                    style={{ fontSize: 10, color: C.dim, fontFamily: C.mono }}
                >
                    {result.latencyMs}ms
                </span>
            </div>

            {/* Capabilities */}
            {result.capabilities.length > 0 && (
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
            )}

            {/* Error */}
            {result.error && (
                <div
                    style={{
                        padding: "8px 14px",
                        fontSize: 11,
                        color: C.red,
                        fontFamily: C.mono,
                        borderTop: `1px solid ${C.border}`
                    }}
                >
                    {result.error}
                </div>
            )}

            {/* Models */}
            {result.models && result.models.length > 0 && (
                <div
                    style={{
                        padding: "8px 14px",
                        borderTop: `1px solid ${C.border}`
                    }}
                >
                    <div
                        style={{
                            fontSize: 9,
                            color: C.dim,
                            marginBottom: 5,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em"
                        }}
                    >
                        Models available {result.models.length}
                    </div>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2
                        }}
                    >
                        {result.models.slice(0, 6).map(m => (
                            <span
                                key={m}
                                style={{
                                    fontSize: 10,
                                    color: C.sub,
                                    fontFamily: C.mono
                                }}
                            >
                                {m}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

import type { CSSProperties, ReactNode } from "react";
import { C } from "../../lib/tokens";

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({
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
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                flexShrink: 0
            }}
        >
            {label}
        </span>
    );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({
    children,
    style
}: {
    children: ReactNode;
    style?: CSSProperties;
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

// ── Row ───────────────────────────────────────────────────────────────────────
export function Row({
    children,
    style
}: {
    children: ReactNode;
    style?: CSSProperties;
}) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                padding: "11px 14px",
                borderBottom: `1px solid ${C.border}`,
                gap: 10,
                minHeight: 44,
                ...style
            }}
        >
            {children}
        </div>
    );
}

// ── SectionLabel ──────────────────────────────────────────────────────────────
export function SectionLabel({ children }: { children: ReactNode }) {
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

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({
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
    style?: CSSProperties;
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
                padding: "10px 12px",
                outline: "none",
                width: "100%",
                minHeight: 44,
                boxSizing: "border-box",
                fontFamily: mono ? "monospace" : "inherit",
                ...style
            }}
        />
    );
}

// ── Textarea ──────────────────────────────────────────────────────────────────
export function Textarea({
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
                padding: "10px 12px",
                outline: "none",
                width: "100%",
                resize: "vertical",
                boxSizing: "border-box",
                fontFamily: mono ? "monospace" : "inherit"
            }}
        />
    );
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({
    value,
    onChange,
    children,
    style
}: {
    value: string;
    onChange: (v: string) => void;
    children: ReactNode;
    style?: CSSProperties;
}) {
    return (
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                color: C.text,
                fontSize: 13,
                padding: "10px 12px",
                outline: "none",
                minHeight: 44,
                boxSizing: "border-box",
                cursor: "pointer",
                ...style
            }}
        >
            {children}
        </select>
    );
}

// ── Btn ───────────────────────────────────────────────────────────────────────
export function Btn({
    children,
    onClick,
    disabled,
    variant = "default",
    style
}: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: "default" | "primary" | "danger";
    style?: CSSProperties;
}) {
    const colors = {
        default: { bg: "#1a1a1a", color: C.text, border: C.border },
        primary: { bg: C.blueDim, color: C.blue, border: C.blue },
        danger: { bg: C.redDim, color: C.red, border: C.red }
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
                padding: "10px 16px",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : 1,
                fontWeight: 500,
                whiteSpace: "nowrap",
                minHeight: 44,
                boxSizing: "border-box",
                WebkitTapHighlightColor: "transparent",
                ...style
            }}
        >
            {children}
        </button>
    );
}

// ── Pre ───────────────────────────────────────────────────────────────────────
export function Pre({ children }: { children: ReactNode }) {
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

// ── Err ───────────────────────────────────────────────────────────────────────
export function Err({ msg }: { msg: string }) {
    return (
        <div
            style={{
                color: C.red,
                fontSize: 12,
                padding: "10px 12px",
                background: C.redDim,
                borderRadius: 6,
                marginTop: 8,
                lineHeight: 1.5
            }}
        >
            {msg}
        </div>
    );
}

// ── Spacer ────────────────────────────────────────────────────────────────────
export function Spacer() {
    return <div style={{ flex: 1 }} />;
}

import { useRef, useState } from "react";
import { Send, Paperclip, Globe, Wrench, X, AlertCircle } from "lucide-react";
import { C } from "@/lib/tokens";
import { fmtCost, fmtTokens, fmtBytes } from "@/utils/format.util";
import type { AttachedFile } from "../chat.types";

// ── Send button ───────────────────────────────────────────────────────────────
export function SendButton({
    onClick,
    disabled
}: {
    onClick: () => void;
    disabled: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: "none",
                flexShrink: 0,
                background: disabled ? C.surface3 : C.blue,
                cursor: disabled ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s"
            }}
        >
            <Send size={12} color={disabled ? C.dim : "white"} />
        </button>
    );
}

// ── Token bar ─────────────────────────────────────────────────────────────────
export function TokenBar({ tokens, cost }: { tokens: number; cost: number }) {
    if (tokens === 0) return null;
    return (
        <div
            style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                padding: "4px 16px",
                borderTop: `1px solid ${C.border}`,
                background: C.bg,
                flexShrink: 0
            }}
        >
            <span style={{ fontSize: 10, color: C.dim, fontFamily: C.mono }}>
                total session cost{" "}
                <span style={{ color: C.sub }}>{fmtCost(cost)}</span>
            </span>
            <span style={{ fontSize: 10, color: C.dim, fontFamily: C.mono }}>
                tokens <span style={{ color: C.sub }}>{fmtTokens(tokens)}</span>
            </span>
        </div>
    );
}

// ── File preview chip ─────────────────────────────────────────────────────────
export function FilePreview({
    file,
    onRemove
}: {
    file: AttachedFile;
    onRemove: () => void;
}) {
    return (
        <div
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 8px",
                background: C.surface2,
                border: `1px solid ${C.border2}`,
                borderRadius: 5,
                fontSize: 10,
                color: C.sub
            }}
        >
            <Paperclip size={9} color={C.dim} />
            <span>{file.name}</span>
            <span style={{ color: C.dim }}>({fmtBytes(file.size)})</span>
            <button
                onClick={onRemove}
                style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: C.dim,
                    display: "flex"
                }}
            >
                <X size={9} />
            </button>
        </div>
    );
}

// ── File attach ───────────────────────────────────────────────────────────────
export function FileAttach({
    onAttach
}: {
    onAttach: (file: AttachedFile) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        onAttach({ name: f.name, size: f.size, type: f.type });
        e.target.value = "";
    };

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                style={{ display: "none" }}
                onChange={handleChange}
            />
            <button
                onClick={() => inputRef.current?.click()}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: "none",
                    border: `1px solid ${C.border2}`,
                    borderRadius: 5,
                    padding: "4px 8px",
                    color: C.dim,
                    fontSize: 11,
                    cursor: "pointer"
                }}
            >
                <Paperclip size={12} />
                Attach
            </button>
        </>
    );
}

// ── Error banner ──────────────────────────────────────────────────────────────
export function ErrorBanner({
    message,
    onDismiss
}: {
    message: string;
    onDismiss: () => void;
}) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                margin: "0 16px 8px",
                background: C.redDim,
                border: `1px solid ${C.redBdr}`,
                borderRadius: 7,
                fontSize: 12,
                color: C.red
            }}
        >
            <AlertCircle size={13} color={C.red} />
            <span style={{ flex: 1 }}>{message}</span>
            <button
                onClick={onDismiss}
                style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: C.red
                }}
            >
                <X size={12} />
            </button>
        </div>
    );
}

// ── Action sheet ──────────────────────────────────────────────────────────────
export function ActionSheet({
    open,
    onClose,
    actions
}: {
    open: boolean;
    onClose: () => void;
    actions: {
        label: string;
        icon?: React.ReactNode;
        onClick: () => void;
        danger?: boolean;
    }[];
}) {
    if (!open) return null;
    return (
        <>
            <div
                onClick={onClose}
                style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.4)",
                    zIndex: 100
                }}
            />
            <div
                style={{
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 101,
                    background: C.surface,
                    border: `1px solid ${C.border2}`,
                    borderRadius: "10px 10px 0 0",
                    padding: "8px 0 24px"
                }}
            >
                {actions.map((a, i) => (
                    <button
                        key={i}
                        onClick={() => {
                            a.onClick();
                            onClose();
                        }}
                        style={{
                            width: "100%",
                            padding: "13px 20px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: a.danger ? C.red : C.text,
                            fontSize: 14,
                            textAlign: "left",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            borderBottom:
                                i < actions.length - 1
                                    ? `1px solid ${C.border}`
                                    : "none"
                        }}
                    >
                        {a.icon}
                        {a.label}
                    </button>
                ))}
            </div>
        </>
    );
}

// ── Input bar ─────────────────────────────────────────────────────────────────
export function InputBar({
    onSend,
    disabled,
    files,
    onAttach,
    onRemoveFile
}: {
    onSend: (text: string) => void;
    disabled: boolean;
    files?: AttachedFile[];
    onAttach?: (f: AttachedFile) => void;
    onRemoveFile?: (i: number) => void;
}) {
    const [text, setText] = useState("");
    const ref = useRef<HTMLTextAreaElement>(null);

    const send = () => {
        if (!text.trim() || disabled) return;
        onSend(text.trim());
        setText("");
        if (ref.current) {
            ref.current.style.height = "auto";
        }
    };

    return (
        <div
            style={{
                borderTop: `1px solid ${C.border}`,
                padding: "10px 16px",
                background: C.bg,
                flexShrink: 0
            }}
        >
            {/* Attached files */}
            {files && files.length > 0 && (
                <div
                    style={{
                        display: "flex",
                        gap: 5,
                        flexWrap: "wrap",
                        marginBottom: 8
                    }}
                >
                    {files.map((f, i) => (
                        <FilePreview
                            key={i}
                            file={f}
                            onRemove={() => onRemoveFile?.(i)}
                        />
                    ))}
                </div>
            )}

            {/* Tool row */}
            <div
                style={{
                    display: "flex",
                    gap: 6,
                    marginBottom: 8,
                    alignItems: "center"
                }}
            >
                {onAttach && <FileAttach onAttach={onAttach} />}
                <button
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        background: "none",
                        border: `1px solid ${C.border2}`,
                        borderRadius: 5,
                        padding: "4px 8px",
                        color: C.dim,
                        fontSize: 11,
                        cursor: "pointer"
                    }}
                >
                    <Globe size={12} />
                    Search
                </button>
                <button
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        background: "none",
                        border: `1px solid ${C.border2}`,
                        borderRadius: 5,
                        padding: "4px 8px",
                        color: C.dim,
                        fontSize: 11,
                        cursor: "pointer"
                    }}
                >
                    <Wrench size={12} />
                    Tools
                </button>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 10, color: C.dim }}>Tool-call</span>
            </div>

            {/* Textarea */}
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-end",
                    background: C.surface,
                    border: `1px solid ${C.border2}`,
                    borderRadius: 8,
                    padding: "8px 10px"
                }}
            >
                <textarea
                    ref={ref}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            send();
                        }
                    }}
                    onInput={() => {
                        if (ref.current) {
                            ref.current.style.height = "auto";
                            ref.current.style.height = `${Math.min(ref.current.scrollHeight, 160)}px`;
                        }
                    }}
                    placeholder="Attach file a message…"
                    disabled={disabled}
                    rows={1}
                    style={{
                        flex: 1,
                        background: "none",
                        border: "none",
                        outline: "none",
                        resize: "none",
                        fontSize: 13,
                        color: C.text,
                        lineHeight: 1.5,
                        minHeight: 20,
                        maxHeight: 160
                    }}
                />
                <SendButton
                    onClick={send}
                    disabled={disabled || !text.trim()}
                />
            </div>
        </div>
    );
}

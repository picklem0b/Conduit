import { Copy } from "lucide-react";
import { C } from "@/lib/tokens";
import { fmtCost, fmtTokens } from "@/utils/format.util";
import type { Message } from "../chat.types";

interface BubbleProps {
    message: Message;
    streaming?: boolean;
}

export function MessageBubble({ message, streaming }: BubbleProps) {
    const isUser = message.role === "user";

    const copy = () =>
        navigator.clipboard.writeText(message.content).catch(() => {});

    return (
        <div
            style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                justifyContent: isUser ? "flex-end" : "flex-start"
            }}
        >
            {!isUser && (
                <div
                    style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: C.surface2,
                        border: `1px solid ${C.border2}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: 2,
                        fontSize: 8,
                        color: C.sub
                    }}
                >
                    ✦
                </div>
            )}

            <div
                style={{
                    maxWidth: "72%",
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 3
                }}
            >
                <div
                    style={{
                        background: isUser ? C.surface2 : C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: isUser
                            ? "10px 10px 2px 10px"
                            : "10px 10px 10px 2px",
                        padding: "9px 12px",
                        fontSize: 13,
                        color: C.text,
                        lineHeight: 1.65,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        position: "relative"
                    }}
                >
                    {message.content}
                    {streaming && <span style={{ color: C.blue }}>▌</span>}
                </div>

                {/* Meta row */}
                {(message.model || message.tokens !== undefined) && (
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            paddingLeft: isUser ? 0 : 2
                        }}
                    >
                        {message.model && (
                            <span
                                style={{
                                    fontSize: 9,
                                    color: C.dim,
                                    fontFamily: C.mono
                                }}
                            >
                                {message.model}
                            </span>
                        )}
                        {message.tokens !== undefined && (
                            <span
                                style={{
                                    fontSize: 9,
                                    color: C.dim,
                                    fontFamily: C.mono
                                }}
                            >
                                {fmtTokens(message.tokens)} tokens
                            </span>
                        )}
                        {message.costUsd !== undefined && (
                            <span
                                style={{
                                    fontSize: 9,
                                    color: C.dim,
                                    fontFamily: C.mono
                                }}
                            >
                                {fmtCost(message.costUsd)}
                            </span>
                        )}
                        {!isUser && (
                            <button
                                onClick={copy}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: C.dimmer,
                                    display: "flex",
                                    padding: "1px"
                                }}
                            >
                                <Copy size={9} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {isUser && (
                <div
                    style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: "linear-gradient(135deg,#22c55e,#3b82f6)",
                        marginTop: 2
                    }}
                />
            )}
        </div>
    );
}

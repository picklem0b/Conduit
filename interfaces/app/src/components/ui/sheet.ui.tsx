import type { ReactNode } from "react";
import { X } from "lucide-react";
import { C } from "@/lib/tokens";

interface SheetProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    side?: "right" | "bottom";
    width?: number;
}

export function Sheet({
    open,
    onClose,
    title,
    children,
    side = "right",
    width = 360
}: SheetProps) {
    if (!open) return null;

    const isRight = side === "right";

    return (
        <>
            <div
                onClick={onClose}
                style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    zIndex: 200,
                    backdropFilter: "blur(1px)"
                }}
            />
            <div
                style={{
                    position: "fixed",
                    zIndex: 201,
                    background: C.surface,
                    border: `1px solid ${C.border2}`,
                    boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
                    ...(isRight
                        ? {
                              top: 0,
                              right: 0,
                              bottom: 0,
                              width,
                              borderRadius: "10px 0 0 10px",
                              display: "flex",
                              flexDirection: "column"
                          }
                        : {
                              left: 0,
                              right: 0,
                              bottom: 0,
                              maxHeight: "80vh",
                              borderRadius: "10px 10px 0 0",
                              display: "flex",
                              flexDirection: "column"
                          })
                }}
            >
                {title && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "14px 16px",
                            borderBottom: `1px solid ${C.border}`,
                            flexShrink: 0
                        }}
                    >
                        <span
                            style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: C.text
                            }}
                        >
                            {title}
                        </span>
                        <button
                            onClick={onClose}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: C.dim,
                                display: "flex"
                            }}
                        >
                            <X size={15} />
                        </button>
                    </div>
                )}
                <div style={{ flex: 1, overflow: "auto" }}>{children}</div>
            </div>
        </>
    );
}

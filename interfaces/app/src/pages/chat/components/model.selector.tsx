import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { C } from "@/lib/tokens";
import { useProviders } from "@/hooks/useProviders.hook";

interface ModelSelectorProps {
    value: string;
    onChange: (model: string) => void;
    cascadeEnabled: boolean;
}

const PROVIDER_COLORS: Record<string, string> = {
    claude: "#e8703a",
    gpt: "#74aa9c",
    gemini: "#4285f4",
    llama: "#a855f7",
    mistral: "#f59e0b",
    groq: "#a855f7"
};

function dotColor(modelId: string): string {
    const prefix = Object.keys(PROVIDER_COLORS).find(k =>
        modelId.toLowerCase().includes(k)
    );
    return prefix ? PROVIDER_COLORS[prefix] : C.dim;
}

export function ModelSelector({
    value,
    onChange,
    cascadeEnabled
}: ModelSelectorProps) {
    const { chatModels } = useProviders();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    return (
        <div ref={ref} style={{ position: "relative" }}>
            <button
                onClick={() => setOpen(v => !v)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    background: C.surface2,
                    border: `1px solid ${C.border2}`,
                    borderRadius: 6,
                    padding: "5px 10px",
                    color: C.text,
                    fontSize: 12,
                    cursor: "pointer"
                }}
            >
                <span
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: cascadeEnabled ? C.green : dotColor(value),
                        boxShadow: cascadeEnabled
                            ? `0 0 5px ${C.green}`
                            : "none"
                    }}
                />
                {value || "Select model"}
                <ChevronDown size={11} color={C.dim} />
            </button>

            {open && (
                <div
                    style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        background: C.surface,
                        border: `1px solid ${C.border2}`,
                        borderRadius: 8,
                        zIndex: 30,
                        minWidth: 220,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                        overflow: "hidden"
                    }}
                >
                    {chatModels.length === 0 ? (
                        <div
                            style={{
                                padding: "10px 12px",
                                fontSize: 11,
                                color: C.dim
                            }}
                        >
                            No models — add a provider key in Settings
                        </div>
                    ) : (
                        chatModels.map(m => (
                            <button
                                key={m.id}
                                onClick={() => {
                                    onChange(m.id);
                                    setOpen(false);
                                }}
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "8px 12px",
                                    background:
                                        m.id === value ? C.surface2 : "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: m.id === value ? C.text : C.sub,
                                    fontSize: 12,
                                    textAlign: "left",
                                    transition: "background 0.1s"
                                }}
                                onMouseEnter={e => {
                                    if (m.id !== value)
                                        e.currentTarget.style.background =
                                            C.surface2;
                                }}
                                onMouseLeave={e => {
                                    if (m.id !== value)
                                        e.currentTarget.style.background =
                                            "none";
                                }}
                            >
                                <span
                                    style={{
                                        width: 5,
                                        height: 5,
                                        borderRadius: "50%",
                                        background: dotColor(m.id),
                                        flexShrink: 0
                                    }}
                                />
                                <span
                                    style={{
                                        flex: 1,
                                        fontFamily: C.mono,
                                        fontSize: 11
                                    }}
                                >
                                    {m.id}
                                </span>
                                {m.contextWindow && (
                                    <span
                                        style={{
                                            fontSize: 9,
                                            color: C.dim,
                                            flexShrink: 0
                                        }}
                                    >
                                        {Math.round(m.contextWindow / 1000)}k
                                    </span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

import { Image, Wand2 } from "lucide-react";
import { C } from "@/lib/tokens";
import { useGenerateStore } from "./generate.store";
import { useAppStore } from "@/store/app.store";
import { generateMedia } from "@/lib/api.lib";

const IMAGE_MODELS = ["dall-e-3", "dall-e-2", "stable-diffusion-3", "sdxl"];
const SIZES = ["1024×1024", "1792×1024", "1024×1792", "512×512"];

// ── Prompt input ──────────────────────────────────────────────────────────────
export function PromptInput({
    value,
    onChange
}: {
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="Describe the image you want to generate…"
            rows={3}
            style={{
                width: "100%",
                background: C.surface,
                border: `1px solid ${C.border2}`,
                borderRadius: 8,
                padding: "10px 12px",
                color: C.text,
                fontSize: 13,
                outline: "none",
                resize: "vertical",
                lineHeight: 1.6
            }}
        />
    );
}

// ── Model selector ────────────────────────────────────────────────────────────
export function ModelSelector({
    value,
    onChange
}: {
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{
                background: C.surface,
                border: `1px solid ${C.border2}`,
                borderRadius: 6,
                padding: "7px 10px",
                color: C.sub,
                fontSize: 12,
                cursor: "pointer"
            }}
        >
            {IMAGE_MODELS.map(m => (
                <option key={m} value={m}>
                    {m}
                </option>
            ))}
        </select>
    );
}

// ── Result grid ───────────────────────────────────────────────────────────────
export function ResultGrid({
    results,
    loading
}: {
    results: { url: string; prompt: string }[];
    loading: boolean;
}) {
    const placeholders = loading ? [null, null, null, null] : [];
    const items = [...results, ...placeholders];

    if (items.length === 0)
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    gap: 10
                }}
            >
                <Image size={28} color={C.dimmer} />
                <span style={{ fontSize: 12, color: C.dim }}>
                    Generated images appear here
                </span>
            </div>
        );

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 8
            }}
        >
            {items.map((r, i) => (
                <div
                    key={i}
                    style={{
                        aspectRatio: "1",
                        background: C.surface2,
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative"
                    }}
                >
                    {r ? (
                        r.url.startsWith("data:") ||
                        r.url.startsWith("http") ? (
                            <img
                                src={r.url}
                                alt={r.prompt}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover"
                                }}
                            />
                        ) : (
                            <Image size={20} color={C.dim} />
                        )
                    ) : (
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                background: `linear-gradient(90deg, ${C.surface2} 25%, ${C.surface3} 50%, ${C.surface2} 75%)`,
                                backgroundSize: "200% 100%",
                                animation: "shimmer 1.5s infinite"
                            }}
                        />
                    )}
                </div>
            ))}
            <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function GeneratePage() {
    const {
        prompt,
        setPrompt,
        model,
        setModel,
        loading,
        setLoading,
        results,
        addResult,
        setError,
        error
    } = useGenerateStore();
    const { pushTerminalLine } = useAppStore();

    const generate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setError(null);
        pushTerminalLine({
            text: `[media] POST /api/media/generate · model: ${model}`,
            type: "dim"
        });
        try {
            const r = (await generateMedia({ prompt, model })) as {
                url?: string;
            };
            addResult({
                url: r.url ?? "",
                prompt,
                model,
                createdAt: Date.now()
            });
            pushTerminalLine({
                text: `[media] generated · ${model} · success`,
                type: "success"
            });
        } catch (e) {
            setError(String(e));
            pushTerminalLine({
                text: `[media] error: ${String(e)}`,
                type: "error"
            });
        }
        setLoading(false);
    };

    return (
        <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
            {/* Left: controls */}
            <div
                style={{
                    width: 280,
                    flexShrink: 0,
                    borderRight: `1px solid ${C.border}`,
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12
                }}
            >
                <PromptInput value={prompt} onChange={setPrompt} />
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <ModelSelector value={model} onChange={setModel} />
                    <select
                        style={{
                            background: C.surface,
                            border: `1px solid ${C.border2}`,
                            borderRadius: 6,
                            padding: "7px 10px",
                            color: C.sub,
                            fontSize: 12,
                            cursor: "pointer"
                        }}
                    >
                        {SIZES.map(s => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>
                {error && (
                    <div
                        style={{
                            fontSize: 11,
                            color: C.red,
                            padding: "7px 10px",
                            background: C.redDim,
                            borderRadius: 5
                        }}
                    >
                        {error}
                    </div>
                )}
                <button
                    onClick={generate}
                    disabled={loading || !prompt.trim()}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 7,
                        padding: "10px",
                        background:
                            loading || !prompt.trim() ? C.surface2 : C.blue,
                        border: "none",
                        borderRadius: 7,
                        color: loading || !prompt.trim() ? C.dim : "white",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor:
                            loading || !prompt.trim() ? "default" : "pointer"
                    }}
                >
                    <Wand2 size={14} />
                    {loading ? "Generating…" : "Generate"}
                </button>
            </div>
            {/* Right: results */}
            <div style={{ flex: 1, overflow: "auto", padding: "14px" }}>
                <ResultGrid results={results} loading={loading} />
            </div>
        </div>
    );
}

export const C = {
    bg: "#080808",
    surface: "#0f0f0f",
    surfaceHover: "#141414",
    border: "#1e1e1e",
    borderHover: "#333",
    muted: "#444",
    dim: "#666",
    text: "#e5e5e5",
    sub: "#999",
    green: "#22c55e",
    greenDim: "#052e16",
    red: "#ef4444",
    redDim: "#2d0a0a",
    amber: "#f59e0b",
    amberDim: "#2d1a00",
    blue: "#3b82f6",
    blueDim: "#0c1a2e",
    purple: "#a855f7",
    purpleDim: "#1a0a2e"
} as const;

export const statusColor = (s: string) => {
    if (s === "operational" || s === "ok") return C.green;
    if (s === "degraded") return C.amber;
    return C.red;
};

export const statusBg = (s: string) => {
    if (s === "operational" || s === "ok") return C.greenDim;
    if (s === "degraded") return C.amberDim;
    return C.redDim;
};

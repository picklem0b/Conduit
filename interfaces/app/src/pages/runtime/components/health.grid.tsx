import { C } from "@/lib/tokens";

export interface HealthScore {
    provider: string;
    score: number;
}

const scoreColor = (s: number) =>
    s >= 0.8 ? C.green : s >= 0.5 ? C.amber : C.red;
const scoreBg = (s: number) =>
    s >= 0.8 ? C.greenDim : s >= 0.5 ? C.amberDim : C.redDim;
const scoreBdr = (s: number) =>
    s >= 0.8 ? C.greenBdr : s >= 0.5 ? C.amberBdr : C.redBdr;

export function HealthGrid({ scores }: { scores: HealthScore[] }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {scores.map(s => (
                <div
                    key={s.provider}
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                    <span
                        style={{
                            fontSize: 10,
                            color: C.dim,
                            fontFamily: C.mono,
                            width: 80,
                            flexShrink: 0
                        }}
                    >
                        {s.provider}
                    </span>
                    <div
                        style={{
                            flex: 1,
                            height: 5,
                            background: C.border,
                            borderRadius: 3,
                            overflow: "hidden"
                        }}
                    >
                        <div
                            style={{
                                width: `${s.score * 100}%`,
                                height: "100%",
                                background: scoreColor(s.score),
                                borderRadius: 3,
                                transition: "width 0.5s ease"
                            }}
                        />
                    </div>
                    <span
                        style={{
                            fontSize: 9,
                            fontFamily: C.mono,
                            width: 32,
                            textAlign: "right",
                            color: scoreColor(s.score),
                            flexShrink: 0
                        }}
                    >
                        {(s.score * 100).toFixed(0)}%
                    </span>
                    <span
                        style={{
                            fontSize: 8,
                            padding: "1px 5px",
                            borderRadius: 3,
                            background: scoreBg(s.score),
                            border: `1px solid ${scoreBdr(s.score)}`,
                            color: scoreColor(s.score),
                            flexShrink: 0
                        }}
                    >
                        {s.score >= 0.8
                            ? "ok"
                            : s.score >= 0.5
                              ? "degraded"
                              : "down"}
                    </span>
                </div>
            ))}
        </div>
    );
}

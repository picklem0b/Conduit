import { C } from "@/lib/tokens";
import { fmtCost, fmtLatency } from "@/utils/format.util";

export interface SessionStats {
    totalRequests: number;
    totalCost: number;
    avgLatencyMs: number;
    cascadeSwitches: number;
}

export function SessionStats({ stats }: { stats: SessionStats }) {
    const items = [
        {
            label: "Total requests",
            value: stats.totalRequests.toLocaleString()
        },
        { label: "Total cost", value: fmtCost(stats.totalCost) },
        { label: "Avg latency", value: fmtLatency(stats.avgLatencyMs) },
        { label: "Cascade switches", value: String(stats.cascadeSwitches) }
    ];
    return (
        <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
        >
            {items.map(item => (
                <div
                    key={item.label}
                    style={{
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: 7,
                        padding: "10px 12px"
                    }}
                >
                    <div
                        style={{
                            fontSize: 9,
                            color: C.dim,
                            textTransform: "uppercase",
                            letterSpacing: "0.07em",
                            marginBottom: 4
                        }}
                    >
                        {item.label}
                    </div>
                    <div
                        style={{
                            fontSize: 18,
                            fontWeight: 700,
                            fontFamily: C.mono,
                            color: C.text,
                            letterSpacing: "-0.03em"
                        }}
                    >
                        {item.value}
                    </div>
                </div>
            ))}
        </div>
    );
}

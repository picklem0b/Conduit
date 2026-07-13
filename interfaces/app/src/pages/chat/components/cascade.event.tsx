import { RotateCcw } from "lucide-react";
import { C } from "@/lib/tokens";
import type { CascadeEvent } from "../chat.types";

export function CascadeEventChip({ from, to, reason, at }: CascadeEvent) {
    return (
        <div
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 9px",
                background: "rgba(245,158,11,0.07)",
                border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: 5,
                fontSize: 10,
                color: C.amber,
                fontFamily: C.mono,
                margin: "3px 0"
            }}
        >
            <RotateCcw size={8} color={C.amber} />
            <span style={{ color: C.dim }}>cascade</span>
            <span>{from}</span>
            <span style={{ color: C.dimmer }}>→</span>
            <span style={{ color: C.text }}>{to}</span>
            <span style={{ color: C.dim }}>·</span>
            <span>{reason}</span>
            <span style={{ color: C.dim }}>·</span>
            <span>{at}ms</span>
        </div>
    );
}

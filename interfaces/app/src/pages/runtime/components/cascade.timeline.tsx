import { C } from "@/lib/tokens";

export interface CascadeEntry {
    from: string;
    to: string;
    reason: string;
    at: string;
}

export function CascadeTimeline({ events }: { events: CascadeEntry[] }) {
    const reasonColor = (r: string) =>
        r === "complete" ? C.green : r.includes("rate") ? C.amber : C.red;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {events.map((e, i) => (
                <div
                    key={i}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        fontSize: 10
                    }}
                >
                    <span
                        style={{
                            color: C.dim,
                            width: 24,
                            flexShrink: 0,
                            fontFamily: C.mono
                        }}
                    >
                        {e.at}
                    </span>
                    <span style={{ color: C.sub, fontFamily: C.mono }}>
                        {e.from}
                    </span>
                    <span style={{ color: C.dimmer }}>→</span>
                    <span style={{ color: C.text, fontFamily: C.mono }}>
                        {e.to}
                    </span>
                    <span
                        style={{
                            fontSize: 8,
                            padding: "1px 5px",
                            borderRadius: 3,
                            flexShrink: 0,
                            color: reasonColor(e.reason),
                            background: reasonColor(e.reason) + "22",
                            border: `1px solid ${reasonColor(e.reason)}44`
                        }}
                    >
                        {e.reason}
                    </span>
                </div>
            ))}
        </div>
    );
}

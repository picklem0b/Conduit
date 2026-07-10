import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { C, statusColor, statusBg } from "../lib/tokens";
import {
    Badge,
    Btn,
    Card,
    Err,
    Pre,
    Row,
    SectionLabel,
    Spacer
} from "../components/ui/primitives";
import type { HealthResp, StatusResp } from "../types/api.types";

export function StatusTab() {
    const [health, setHealth] = useState<HealthResp | null>(null);
    const [status, setStatus] = useState<StatusResp | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const refresh = useCallback(async () => {
        setLoading(true);
        setErr("");
        try {
            const [h, s] = await Promise.all([
                api<HealthResp>("/health"),
                api<StatusResp>("/status")
            ]);
            setHealth(h);
            setStatus(s);
        } catch (e) {
            setErr(String(e));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Btn
                onClick={refresh}
                disabled={loading}
                style={{ alignSelf: "flex-start" }}
            >
                {loading ? "Checking…" : "Refresh"}
            </Btn>

            {err && <Err msg={err} />}

            {health && (
                <div>
                    <SectionLabel>GET /api/health</SectionLabel>
                    <Card>
                        <Row>
                            <span style={{ fontSize: 13 }}>
                                Gateway process
                            </span>
                            <Spacer />
                            <Badge
                                label={health.status}
                                color={C.green}
                                bg={C.greenDim}
                            />
                            <span style={{ fontSize: 11, color: C.dim }}>
                                {new Date(
                                    health.timestamp
                                ).toLocaleTimeString()}
                            </span>
                        </Row>
                    </Card>
                </div>
            )}

            {status && (
                <>
                    <div>
                        <SectionLabel>
                            GET /api/status — overall: {status.overall}
                        </SectionLabel>
                        <Card>
                            {status.services.map(s => (
                                <Row key={s.name}>
                                    <span style={{ fontSize: 13 }}>
                                        {s.name}
                                    </span>
                                    <Spacer />
                                    {s.latencyMs !== null && (
                                        <span
                                            style={{
                                                fontSize: 11,
                                                color: C.dim,
                                                fontFamily: "monospace"
                                            }}
                                        >
                                            {s.latencyMs}ms
                                        </span>
                                    )}
                                    <Badge
                                        label={s.status}
                                        color={statusColor(s.status)}
                                        bg={statusBg(s.status)}
                                    />
                                </Row>
                            ))}
                        </Card>
                    </div>

                    {status.mirrors.length > 0 && (
                        <div>
                            <SectionLabel>Mirrors</SectionLabel>
                            <Card>
                                {status.mirrors.map(m => (
                                    <Row key={m.url}>
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div style={{ fontSize: 13 }}>
                                                {m.label}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 11,
                                                    color: C.dim,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap"
                                                }}
                                            >
                                                {m.url}
                                            </div>
                                        </div>
                                        {m.latencyMs !== null && (
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    color: C.dim,
                                                    fontFamily: "monospace",
                                                    flexShrink: 0
                                                }}
                                            >
                                                {m.latencyMs}ms
                                            </span>
                                        )}
                                        <Badge
                                            label={m.status}
                                            color={statusColor(m.status)}
                                            bg={statusBg(m.status)}
                                        />
                                    </Row>
                                ))}
                            </Card>
                        </div>
                    )}

                    <div>
                        <SectionLabel>Raw response</SectionLabel>
                        <Pre>{JSON.stringify(status, null, 2)}</Pre>
                    </div>
                </>
            )}
        </div>
    );
}

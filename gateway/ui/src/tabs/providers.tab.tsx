import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { C } from "../lib/tokens";
import {
    Badge,
    Btn,
    Card,
    Err,
    Row,
    SectionLabel,
    Spacer
} from "../components/ui/primitives";
import type { ModelsResp, ProviderHealth } from "../types/api.types";

export function ProvidersTab() {
    const [providers, setProviders] = useState<ProviderHealth[]>([]);
    const [models, setModels] = useState<ModelsResp | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const refresh = useCallback(async () => {
        setLoading(true);
        setErr("");
        try {
            const [p, m] = await Promise.all([
                api<{ providers: ProviderHealth[] }>("/providers/health"),
                api<ModelsResp>("/models")
            ]);
            setProviders(p.providers);
            setModels(m);
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
                {loading ? "Loading…" : "Refresh"}
            </Btn>
            {err && <Err msg={err} />}

            {providers.length > 0 && (
                <div>
                    <SectionLabel>GET /api/providers/health</SectionLabel>
                    <Card>
                        {providers.map(p => (
                            <Row key={p.id}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontSize: 13,
                                            fontFamily: "monospace"
                                        }}
                                    >
                                        {p.id}
                                    </div>
                                    <div style={{ fontSize: 11, color: C.dim }}>
                                        {p.latencyMs !== undefined
                                            ? `${p.latencyMs}ms`
                                            : "—"}{" "}
                                        · {p.modelCount ?? "—"} models
                                    </div>
                                </div>
                                <Badge
                                    label={
                                        !p.configured
                                            ? "no key"
                                            : p.healthy
                                              ? "ok"
                                              : "error"
                                    }
                                    color={
                                        !p.configured
                                            ? C.dim
                                            : p.healthy
                                              ? C.green
                                              : C.red
                                    }
                                    bg={
                                        !p.configured
                                            ? "#1a1a1a"
                                            : p.healthy
                                              ? C.greenDim
                                              : C.redDim
                                    }
                                />
                            </Row>
                        ))}
                    </Card>
                </div>
            )}

            {models && (
                <>
                    <div>
                        <SectionLabel>
                            GET /api/models — chat ({models.chat.length})
                        </SectionLabel>
                        <Card>
                            {models.chat.map(m => (
                                <Row key={m.id}>
                                    <span
                                        style={{
                                            fontSize: 13,
                                            fontFamily: "monospace",
                                            flex: 1
                                        }}
                                    >
                                        {m.id}
                                    </span>
                                    {m.contextWindow && (
                                        <span
                                            style={{
                                                fontSize: 11,
                                                color: C.dim,
                                                flexShrink: 0
                                            }}
                                        >
                                            {(m.contextWindow / 1000).toFixed(
                                                0
                                            )}
                                            k ctx
                                        </span>
                                    )}
                                </Row>
                            ))}
                        </Card>
                    </div>

                    {models.image.length > 0 && (
                        <div>
                            <SectionLabel>
                                Image models ({models.image.length})
                            </SectionLabel>
                            <Card>
                                {models.image.map(m => (
                                    <Row key={m.id}>
                                        <span
                                            style={{
                                                fontSize: 13,
                                                fontFamily: "monospace"
                                            }}
                                        >
                                            {m.id}
                                        </span>
                                    </Row>
                                ))}
                            </Card>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

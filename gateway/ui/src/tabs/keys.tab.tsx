import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { C } from "../lib/tokens";
import {
    Btn,
    Card,
    Err,
    Input,
    Pre,
    Row,
    SectionLabel,
    Select,
    Spacer
} from "../components/ui/primitives";
import { PROVIDERS } from "../types/api.types";
import type { KeyMeta } from "../types/api.types";

export function KeysTab() {
    const [keys, setKeys] = useState<KeyMeta[]>([]);
    const [provider, setProvider] = useState("anthropic");
    const [keyValue, setKeyValue] = useState("");
    const [introspectProvider, setIntrospectProvider] = useState("anthropic");
    const [introspectKey, setIntrospectKey] = useState("");
    const [result, setResult] = useState<unknown>(null);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    const fetchKeys = useCallback(async () => {
        try {
            setKeys(await api<KeyMeta[]>("/keys"));
        } catch {
            setKeys([]);
        }
    }, []);

    useEffect(() => {
        fetchKeys();
    }, [fetchKeys]);

    const save = async () => {
        setLoading(true);
        setErr("");
        setResult(null);
        try {
            const r = await api<unknown>("/keys", {
                method: "POST",
                body: JSON.stringify({ provider, key: keyValue })
            });
            setResult(r);
            setKeyValue("");
            await fetchKeys();
        } catch (e) {
            setErr(String(e));
        } finally {
            setLoading(false);
        }
    };

    const del = async (p: string) => {
        try {
            await api(`/keys/${p}`, { method: "DELETE" });
            await fetchKeys();
        } catch (e) {
            setErr(String(e));
        }
    };

    const introspect = async () => {
        setLoading(true);
        setErr("");
        setResult(null);
        try {
            const r = await api<unknown>("/keys/introspect", {
                method: "POST",
                body: JSON.stringify({
                    provider: introspectProvider,
                    key: introspectKey
                })
            });
            setResult(r);
        } catch (e) {
            setErr(String(e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Saved keys */}
            <div>
                <SectionLabel>GET /api/keys — saved keys</SectionLabel>
                <Card>
                    {keys.length === 0 ? (
                        <Row>
                            <span style={{ color: C.dim, fontSize: 13 }}>
                                No keys saved
                            </span>
                        </Row>
                    ) : (
                        keys.map(k => (
                            <Row key={k.provider}>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ fontSize: 13 }}>
                                        {k.provider}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: C.dim,
                                            fontFamily: "monospace"
                                        }}
                                    >
                                        {k.hint} ·{" "}
                                        {new Date(
                                            k.savedAt
                                        ).toLocaleDateString()}
                                    </div>
                                </div>
                                <Btn
                                    variant="danger"
                                    onClick={() => del(k.provider)}
                                    style={{
                                        padding: "6px 10px",
                                        fontSize: 11,
                                        minHeight: 32
                                    }}
                                >
                                    Remove
                                </Btn>
                            </Row>
                        ))
                    )}
                </Card>
            </div>

            {/* Save a key */}
            <div>
                <SectionLabel>POST /api/keys — save key</SectionLabel>
                <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                    <Select
                        value={provider}
                        onChange={setProvider}
                        style={{ width: "100%" }}
                    >
                        {PROVIDERS.map(p => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </Select>
                    <Input
                        value={keyValue}
                        onChange={setKeyValue}
                        placeholder="sk-…"
                        type="password"
                        mono
                    />
                    <Btn
                        variant="primary"
                        onClick={save}
                        disabled={loading || !keyValue}
                    >
                        Save key
                    </Btn>
                </div>
                {err && <Err msg={err} />}
                {result && <Pre>{JSON.stringify(result, null, 2)}</Pre>}
            </div>

            {/* Introspect */}
            <div
                style={{
                    borderTop: `1px solid ${C.border}`,
                    paddingTop: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8
                }}
            >
                <SectionLabel>
                    POST /api/keys/introspect — test without saving
                </SectionLabel>
                <Select
                    value={introspectProvider}
                    onChange={setIntrospectProvider}
                    style={{ width: "100%" }}
                >
                    {PROVIDERS.map(p => (
                        <option key={p} value={p}>
                            {p}
                        </option>
                    ))}
                </Select>
                <Input
                    value={introspectKey}
                    onChange={setIntrospectKey}
                    placeholder="sk-…"
                    type="password"
                    mono
                />
                <Btn onClick={introspect} disabled={loading || !introspectKey}>
                    Test key
                </Btn>
                {result && <Pre>{JSON.stringify(result, null, 2)}</Pre>}
            </div>
        </div>
    );
}

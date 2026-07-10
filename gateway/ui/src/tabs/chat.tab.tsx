import { useState, useEffect, useRef, useCallback } from "react";
import { api, streamSSE } from "../lib/api";
import { C } from "../lib/tokens";
import {
    Btn,
    Err,
    Input,
    Pre,
    Row,
    SectionLabel,
    Select,
    Textarea
} from "../components/ui/primitives";
import type { Model, ModelsResp, SSEEvent } from "../types/api.types";

export function ChatTab() {
    const [models, setModels] = useState<Model[]>([]);
    const [model, setModel] = useState("");
    const [system, setSystem] = useState("");
    const [userMsg, setUserMsg] = useState("Hello! Tell me a short joke.");
    const [conversationId, setConversationId] = useState("");
    const [cascadeEnabled, setCascadeEnabled] = useState(false);
    const [profile, setProfile] = useState("balanced");
    const [streaming, setStreaming] = useState(false);
    const [tokens, setTokens] = useState("");
    const [events, setEvents] = useState<SSEEvent[]>([]);
    const [err, setErr] = useState("");
    const [historyId, setHistoryId] = useState("");
    const [history, setHistory] = useState<unknown>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        api<ModelsResp>("/models")
            .then(r => {
                setModels(r.chat);
                if (r.chat[0]) setModel(r.chat[0].id);
            })
            .catch(() => {});
    }, []);

    const stream = useCallback(async () => {
        if (!userMsg.trim()) return;
        setStreaming(true);
        setTokens("");
        setEvents([]);
        setErr("");
        abortRef.current = new AbortController();

        try {
            await streamSSE(
                "/chat/stream",
                {
                    model,
                    messages: [
                        ...(system
                            ? [{ role: "system", content: system }]
                            : []),
                        { role: "user", content: userMsg }
                    ],
                    conversationId: conversationId || undefined,
                    cascadeEnabled,
                    profile: cascadeEnabled ? profile : undefined
                },
                abortRef.current.signal,
                evt => {
                    setEvents(prev => [...prev, evt]);
                    if (evt.type === "token")
                        setTokens(prev => prev + String(evt.content ?? ""));
                }
            );
        } catch (e) {
            if ((e as Error).name !== "AbortError") setErr(String(e));
        } finally {
            setStreaming(false);
        }
    }, [model, system, userMsg, conversationId, cascadeEnabled, profile]);

    const fetchHistory = async () => {
        if (!historyId) return;
        try {
            const r = await api<unknown>(`/chat/history/${historyId}`);
            setHistory(r);
        } catch (e) {
            setErr(String(e));
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Model + conversation ID */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                    <SectionLabel>Model</SectionLabel>
                    <Select
                        value={model}
                        onChange={setModel}
                        style={{ width: "100%" }}
                    >
                        {models.length === 0 && (
                            <option value="">Loading…</option>
                        )}
                        {models.map(m => (
                            <option key={m.id} value={m.id}>
                                {m.id}
                            </option>
                        ))}
                    </Select>
                </div>
                <div>
                    <SectionLabel>Conversation ID (optional)</SectionLabel>
                    <Input
                        value={conversationId}
                        onChange={setConversationId}
                        placeholder="uuid — leave blank for new"
                        mono
                    />
                </div>
            </div>

            <div>
                <SectionLabel>System prompt (optional)</SectionLabel>
                <Textarea
                    value={system}
                    onChange={setSystem}
                    placeholder="You are a helpful assistant."
                    rows={2}
                />
            </div>

            <div>
                <SectionLabel>User message</SectionLabel>
                <Textarea value={userMsg} onChange={setUserMsg} rows={3} />
            </div>

            {/* Cascade toggle */}
            <div
                style={{
                    padding: "12px 14px",
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10
                }}
            >
                <label
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 13,
                        cursor: "pointer"
                    }}
                >
                    <input
                        type="checkbox"
                        checked={cascadeEnabled}
                        onChange={e => setCascadeEnabled(e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: C.blue }}
                    />
                    Cascade enabled
                </label>
                {cascadeEnabled && (
                    <div>
                        <SectionLabel>Profile</SectionLabel>
                        <Select
                            value={profile}
                            onChange={setProfile}
                            style={{ width: "100%" }}
                        >
                            {[
                                "quality",
                                "balanced",
                                "cheap",
                                "speed",
                                "offline"
                            ].map(p => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </Select>
                    </div>
                )}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
                <Btn
                    variant="primary"
                    onClick={stream}
                    disabled={streaming || !model}
                    style={{ flex: 1 }}
                >
                    {streaming ? "Streaming…" : "POST /api/chat/stream"}
                </Btn>
                {streaming && (
                    <Btn
                        variant="danger"
                        onClick={() => abortRef.current?.abort()}
                    >
                        Abort
                    </Btn>
                )}
            </div>

            {err && <Err msg={err} />}

            {(tokens || streaming) && (
                <div>
                    <SectionLabel>Response</SectionLabel>
                    <div
                        style={{
                            background: C.bg,
                            border: `1px solid ${C.border}`,
                            borderRadius: 6,
                            padding: 12,
                            fontSize: 13,
                            lineHeight: 1.7,
                            minHeight: 80,
                            whiteSpace: "pre-wrap"
                        }}
                    >
                        {tokens}
                        {streaming && <span style={{ color: C.dim }}>▌</span>}
                    </div>
                </div>
            )}

            {events.length > 0 && (
                <div>
                    <SectionLabel>SSE events ({events.length})</SectionLabel>
                    <div
                        style={{
                            maxHeight: 240,
                            overflowY: "auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: 3
                        }}
                    >
                        {events.map((evt, i) => {
                            const col =
                                evt.type === "error"
                                    ? C.red
                                    : evt.type === "cascade_switch"
                                      ? C.amber
                                      : evt.type === "done" ||
                                          evt.type === "cascade_complete"
                                        ? C.green
                                        : C.dim;
                            return (
                                <div
                                    key={i}
                                    style={{
                                        fontSize: 11,
                                        fontFamily: "monospace",
                                        color: col,
                                        background: C.bg,
                                        borderRadius: 4,
                                        padding: "4px 8px"
                                    }}
                                >
                                    <span style={{ color: C.dim }}>
                                        [{evt.type}]
                                    </span>{" "}
                                    {evt.type === "token"
                                        ? ""
                                        : JSON.stringify(evt)}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div
                style={{
                    borderTop: `1px solid ${C.border}`,
                    paddingTop: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10
                }}
            >
                <SectionLabel>
                    GET /api/chat/history/:conversationId
                </SectionLabel>
                <div style={{ display: "flex", gap: 8 }}>
                    <Input
                        value={historyId}
                        onChange={setHistoryId}
                        placeholder="conversation ID"
                        mono
                    />
                    <Btn onClick={fetchHistory} style={{ flexShrink: 0 }}>
                        Fetch
                    </Btn>
                </div>
                {history && <Pre>{JSON.stringify(history, null, 2)}</Pre>}
            </div>
        </div>
    );
}

import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { C } from "../lib/tokens";
import {
    Btn,
    Err,
    Input,
    Pre,
    SectionLabel,
    Select,
    Textarea
} from "../components/ui/primitives";
import { PROVIDERS } from "../types/api.types";

// ── Discovery ─────────────────────────────────────────────────────────────────
export function DiscoveryTab() {
    const [provider, setProvider] = useState("anthropic");
    const [key, setKey] = useState("");
    const [result, setResult] = useState<unknown>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const probe = async () => {
        setLoading(true);
        setErr("");
        setResult(null);
        try {
            const r = await api<unknown>("/discovery/probe", {
                method: "POST",
                body: JSON.stringify({ provider, key })
            });
            setResult(r);
        } catch (e) {
            setErr(String(e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p
                style={{
                    fontSize: 13,
                    color: C.sub,
                    lineHeight: 1.6,
                    margin: 0
                }}
            >
                Tests a key against all known providers to discover what it's
                valid for. Keys are never stored.
            </p>
            <SectionLabel>POST /api/discovery/probe</SectionLabel>
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
                value={key}
                onChange={setKey}
                placeholder="API key to probe"
                type="password"
                mono
            />
            <Btn variant="primary" onClick={probe} disabled={loading || !key}>
                {loading ? "Probing…" : "Probe"}
            </Btn>
            {err && <Err msg={err} />}
            {result && <Pre>{JSON.stringify(result, null, 2)}</Pre>}
        </div>
    );
}

// ── Media ─────────────────────────────────────────────────────────────────────
export function MediaTab() {
    const [prompt, setPrompt] = useState(
        "A minimal dark tech interface, abstract"
    );
    const [model, setModel] = useState("dall-e-3");
    const [result, setResult] = useState<unknown>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [providers, setProviders] = useState<unknown>(null);

    useEffect(() => {
        api<unknown>("/media/providers")
            .then(setProviders)
            .catch(() => {});
    }, []);

    const generate = async () => {
        setLoading(true);
        setErr("");
        setResult(null);
        try {
            const r = await api<unknown>("/media/generate", {
                method: "POST",
                body: JSON.stringify({ prompt, model })
            });
            setResult(r);
        } catch (e) {
            setErr(String(e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {providers && (
                <div>
                    <SectionLabel>GET /api/media/providers</SectionLabel>
                    <Pre>{JSON.stringify(providers, null, 2)}</Pre>
                </div>
            )}
            <SectionLabel>POST /api/media/generate</SectionLabel>
            <Input
                value={model}
                onChange={setModel}
                placeholder="dall-e-3 / stable-diffusion-3…"
            />
            <Textarea
                value={prompt}
                onChange={setPrompt}
                placeholder="Describe the image…"
                rows={3}
            />
            <Btn variant="primary" onClick={generate} disabled={loading}>
                {loading ? "Generating…" : "Generate"}
            </Btn>
            {err && <Err msg={err} />}
            {result && <Pre>{JSON.stringify(result, null, 2)}</Pre>}
        </div>
    );
}

// ── Search ────────────────────────────────────────────────────────────────────
export function SearchTab() {
    const [query, setQuery] = useState("latest AI model benchmarks 2025");
    const [providerS, setProviderS] = useState("brave");
    const [result, setResult] = useState<unknown>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [providers, setProviders] = useState<unknown>(null);

    useEffect(() => {
        api<unknown>("/search/providers")
            .then(setProviders)
            .catch(() => {});
    }, []);

    const search = async () => {
        setLoading(true);
        setErr("");
        setResult(null);
        try {
            const r = await api<unknown>("/search/query", {
                method: "POST",
                body: JSON.stringify({ query, provider: providerS })
            });
            setResult(r);
        } catch (e) {
            setErr(String(e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {providers && (
                <div>
                    <SectionLabel>GET /api/search/providers</SectionLabel>
                    <Pre>{JSON.stringify(providers, null, 2)}</Pre>
                </div>
            )}
            <SectionLabel>POST /api/search/query</SectionLabel>
            <Select
                value={providerS}
                onChange={setProviderS}
                style={{ width: "100%" }}
            >
                <option value="brave">brave</option>
                <option value="serpapi">serpapi</option>
            </Select>
            <Input
                value={query}
                onChange={setQuery}
                placeholder="Search query…"
            />
            <Btn variant="primary" onClick={search} disabled={loading}>
                {loading ? "Searching…" : "Search"}
            </Btn>
            {err && <Err msg={err} />}
            {result && <Pre>{JSON.stringify(result, null, 2)}</Pre>}
        </div>
    );
}

// ── Code ──────────────────────────────────────────────────────────────────────
export function CodeTab() {
    const [code, setCode] = useState('print("Hello from Conduit sandbox!")');
    const [language, setLanguage] = useState("python");
    const [result, setResult] = useState<unknown>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const execute = async () => {
        setLoading(true);
        setErr("");
        setResult(null);
        try {
            const r = await api<unknown>("/code/execute", {
                method: "POST",
                body: JSON.stringify({ code, language })
            });
            setResult(r);
        } catch (e) {
            setErr(String(e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <SectionLabel>POST /api/code/execute</SectionLabel>
            <Select
                value={language}
                onChange={setLanguage}
                style={{ width: "100%" }}
            >
                {[
                    "python",
                    "javascript",
                    "typescript",
                    "bash",
                    "go",
                    "rust"
                ].map(l => (
                    <option key={l} value={l}>
                        {l}
                    </option>
                ))}
            </Select>
            <Textarea value={code} onChange={setCode} rows={8} mono />
            <Btn variant="primary" onClick={execute} disabled={loading}>
                {loading ? "Executing…" : "Execute"}
            </Btn>
            {err && <Err msg={err} />}
            {result && <Pre>{JSON.stringify(result, null, 2)}</Pre>}
        </div>
    );
}

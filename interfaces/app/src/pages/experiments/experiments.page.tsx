import { useState } from "react";
import { Play, Plus, Download } from "lucide-react";
import { C } from "@/lib/tokens";
import { useAppStore } from "@/store/app.store";

const VARIABLE_SETS = ["A", "B", "C"] as const;
type VarSet = (typeof VARIABLE_SETS)[number];

interface Variable {
    key: string;
    value: string;
}
interface ExperimentResult {
    set: VarSet;
    model: string;
    latencyMs: number;
    tokens: number;
    costUsd: number;
    output: string;
    pass: boolean;
}

const DEFAULT_TEMPLATE = `{{#system}}
You are a concise AI assistant.
{{/system}}

{{#user}}
Respond to: {{prompt}}

Format: {{format}}
{{/user}}`;

const DEFAULT_VARS: Record<VarSet, Variable[]> = {
    A: [
        { key: "prompt", value: "Explain cascade in 1 sentence." },
        { key: "format", value: "markdown" }
    ],
    B: [
        { key: "prompt", value: "What is cascade? Be brief." },
        { key: "format", value: "plain" }
    ],
    C: [
        { key: "prompt", value: "Define cascade concisely." },
        { key: "format", value: "json" }
    ]
};

const MOCK_RESULTS: ExperimentResult[] = [
    {
        set: "A",
        model: "gpt-4o-mini",
        latencyMs: 340,
        tokens: 142,
        costUsd: 0.0001,
        output: "Cascade is the automatic failover mechanism that routes requests to the next healthy provider when one fails.",
        pass: true
    },
    {
        set: "B",
        model: "gpt-4o-mini",
        latencyMs: 298,
        tokens: 118,
        costUsd: 0.0001,
        output: "Cascade automatically switches to a backup AI provider when the primary one fails or is rate-limited.",
        pass: true
    },
    {
        set: "C",
        model: "gpt-4o-mini",
        latencyMs: 412,
        tokens: 167,
        costUsd: 0.0002,
        output: `{"definition":"Cascade is an automatic failover that routes to healthy providers on failure."}`,
        pass: false
    }
];

function VarEditor({
    vars,
    onChange
}: {
    vars: Variable[];
    onChange: (v: Variable[]) => void;
}) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {vars.map((v, i) => (
                <div
                    key={i}
                    style={{ display: "flex", gap: 6, alignItems: "center" }}
                >
                    <input
                        value={v.key}
                        onChange={e => {
                            const nv = [...vars];
                            nv[i] = { ...nv[i], key: e.target.value };
                            onChange(nv);
                        }}
                        style={{
                            width: 80,
                            background: C.surface2,
                            border: `1px solid ${C.border2}`,
                            borderRadius: 4,
                            padding: "4px 7px",
                            color: C.sub,
                            fontSize: 11,
                            fontFamily: C.mono,
                            outline: "none"
                        }}
                    />
                    <span style={{ color: C.dim, fontSize: 11 }}>=</span>
                    <input
                        value={v.value}
                        onChange={e => {
                            const nv = [...vars];
                            nv[i] = { ...nv[i], value: e.target.value };
                            onChange(nv);
                        }}
                        style={{
                            flex: 1,
                            background: C.surface2,
                            border: `1px solid ${C.border2}`,
                            borderRadius: 4,
                            padding: "4px 7px",
                            color: C.text,
                            fontSize: 11,
                            fontFamily: C.mono,
                            outline: "none"
                        }}
                    />
                </div>
            ))}
        </div>
    );
}

export function ExperimentsPage() {
    const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
    const [vars, setVars] = useState({ ...DEFAULT_VARS });
    const [activeSet, setActiveSet] = useState<VarSet>("A");
    const [results, setResults] = useState<ExperimentResult[]>([]);
    const [running, setRunning] = useState(false);
    const [diffView, setDiffView] = useState(false);
    const [streaming, setStreaming] = useState(false);
    const { pushTerminalLine } = useAppStore();

    const runAll = async () => {
        setRunning(true);
        pushTerminalLine({
            text: "[experiment] running 3 variable sets · gpt-4o-mini",
            type: "dim"
        });
        await new Promise(r => setTimeout(r, 900));
        setResults(MOCK_RESULTS);
        MOCK_RESULTS.forEach(r => {
            pushTerminalLine({
                text: `[experiment] ${r.set} · gpt-4o-mini · ${r.latencyMs}ms · $${r.costUsd.toFixed(4)} · ${r.pass ? "pass" : "fail"}`,
                type: r.pass ? "success" : "error"
            });
        });
        setRunning(false);
    };

    return (
        <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
            {/* Left: template editor */}
            <div
                style={{
                    width: "40%",
                    flexShrink: 0,
                    borderRight: `1px solid ${C.border}`,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                }}
            >
                {/* Controls */}
                <div
                    style={{
                        padding: "8px 12px",
                        borderBottom: `1px solid ${C.border}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        flexWrap: "wrap"
                    }}
                >
                    <button
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 9px",
                            background: C.surface2,
                            border: `1px solid ${C.border2}`,
                            borderRadius: 5,
                            color: C.sub,
                            fontSize: 10,
                            cursor: "pointer"
                        }}
                    >
                        <Plus size={9} />
                        add call
                    </button>
                    <button
                        onClick={runAll}
                        disabled={running}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 9px",
                            background: running ? C.surface2 : C.greenDim,
                            border: `1px solid ${running ? C.border2 : C.greenBdr}`,
                            borderRadius: 5,
                            color: running ? C.dim : C.green,
                            fontSize: 10,
                            cursor: running ? "not-allowed" : "pointer"
                        }}
                    >
                        <Play size={9} />
                        run all
                    </button>
                    <button
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 9px",
                            background: C.surface2,
                            border: `1px solid ${C.border2}`,
                            borderRadius: 5,
                            color: C.sub,
                            fontSize: 10,
                            cursor: "pointer"
                        }}
                    >
                        <Download size={9} />
                        export JSON
                    </button>
                    <div style={{ flex: 1 }} />
                    <span style={{ fontSize: 10, color: C.dim }}>
                        Variable set
                    </span>
                    <div
                        style={{
                            display: "flex",
                            background: C.surface2,
                            border: `1px solid ${C.border2}`,
                            borderRadius: 4,
                            overflow: "hidden"
                        }}
                    >
                        {VARIABLE_SETS.map(s => (
                            <button
                                key={s}
                                onClick={() => setActiveSet(s)}
                                style={{
                                    padding: "3px 9px",
                                    background:
                                        activeSet === s ? C.blue : "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: activeSet === s ? "white" : C.dim,
                                    fontSize: 10,
                                    fontFamily: C.mono
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Template editor */}
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden"
                    }}
                >
                    <div
                        style={{
                            padding: "8px 12px 4px",
                            fontSize: 10,
                            color: C.dim,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em"
                        }}
                    >
                        Prompt template
                    </div>
                    <textarea
                        value={template}
                        onChange={e => setTemplate(e.target.value)}
                        style={{
                            flex: 1,
                            background: "none",
                            border: "none",
                            outline: "none",
                            resize: "none",
                            padding: "4px 12px 12px",
                            fontSize: 11,
                            color: C.sub,
                            fontFamily: C.mono,
                            lineHeight: 1.6
                        }}
                    />
                </div>

                {/* Variables editor */}
                <div
                    style={{
                        borderTop: `1px solid ${C.border}`,
                        padding: "10px 12px",
                        flexShrink: 0
                    }}
                >
                    <div
                        style={{
                            fontSize: 10,
                            color: C.dim,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            marginBottom: 8
                        }}
                    >
                        Variables
                    </div>
                    <VarEditor
                        vars={vars[activeSet]}
                        onChange={v =>
                            setVars(prev => ({ ...prev, [activeSet]: v }))
                        }
                    />
                </div>
            </div>

            {/* Right: results + diff view */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                }}
            >
                {/* Diff view toggle */}
                <div
                    style={{
                        padding: "8px 12px",
                        borderBottom: `1px solid ${C.border}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 8
                    }}
                >
                    <span style={{ fontSize: 11, color: C.dim }}>
                        Diff view
                    </span>
                    <label
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            cursor: "pointer"
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={diffView}
                            onChange={e => setDiffView(e.target.checked)}
                            style={{ accentColor: C.blue }}
                        />
                        <span style={{ fontSize: 11, color: C.sub }}>
                            Streaming
                        </span>
                    </label>
                    <div style={{ flex: 1 }} />
                    {results.length > 0 && (
                        <span
                            style={{
                                fontSize: 10,
                                color: C.dim,
                                fontFamily: C.mono
                            }}
                        >
                            {results.filter(r => r.pass).length}/
                            {results.length} pass
                        </span>
                    )}
                </div>

                {/* Results */}
                <div style={{ flex: 1, overflow: "auto", padding: "12px" }}>
                    {results.length === 0 ? (
                        <div
                            style={{
                                color: C.dim,
                                fontSize: 12,
                                padding: "20px 0",
                                textAlign: "center"
                            }}
                        >
                            Configure variables and click "run all" to compare
                            outputs.
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 10
                            }}
                        >
                            {results.map((r, i) => (
                                <div
                                    key={i}
                                    style={{
                                        background: C.surface,
                                        border: `1px solid ${r.pass ? C.border : C.redBdr}`,
                                        borderRadius: 7,
                                        overflow: "hidden"
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            padding: "7px 12px",
                                            borderBottom: `1px solid ${C.border}`,
                                            background: C.surface2
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 9,
                                                fontWeight: 700,
                                                fontFamily: C.mono,
                                                color: "white",
                                                background: C.blue,
                                                padding: "2px 6px",
                                                borderRadius: 3
                                            }}
                                        >
                                            {r.set}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 10,
                                                color: C.sub,
                                                fontFamily: C.mono
                                            }}
                                        >
                                            {r.model}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 9,
                                                color: C.dim,
                                                fontFamily: C.mono
                                            }}
                                        >
                                            {r.latencyMs}ms
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 9,
                                                color: C.dim,
                                                fontFamily: C.mono
                                            }}
                                        >
                                            ${r.costUsd.toFixed(4)}
                                        </span>
                                        <div style={{ flex: 1 }} />
                                        <span
                                            style={{
                                                fontSize: 9,
                                                padding: "1px 6px",
                                                borderRadius: 3,
                                                fontFamily: C.mono,
                                                color: r.pass ? C.green : C.red,
                                                background: r.pass
                                                    ? C.greenDim
                                                    : C.redDim,
                                                border: `1px solid ${r.pass ? C.greenBdr : C.redBdr}`
                                            }}
                                        >
                                            {r.pass ? "pass" : "fail"}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            padding: "10px 12px",
                                            fontSize: 12,
                                            color: C.sub,
                                            lineHeight: 1.65,
                                            fontFamily: C.mono
                                        }}
                                    >
                                        {r.output}
                                    </div>
                                </div>
                            ))}

                            {/* Diff rows */}
                            {diffView && results.length >= 2 && (
                                <div
                                    style={{
                                        background: C.surface,
                                        border: `1px solid ${C.border}`,
                                        borderRadius: 7,
                                        overflow: "hidden"
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: "7px 12px",
                                            borderBottom: `1px solid ${C.border}`,
                                            fontSize: 10,
                                            color: C.dim
                                        }}
                                    >
                                        Diff A → B
                                    </div>
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 1fr",
                                            gap: 0
                                        }}
                                    >
                                        {[results[0], results[1]].map(
                                            (r, i) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        padding: "8px 12px",
                                                        borderRight:
                                                            i === 0
                                                                ? `1px solid ${C.border}`
                                                                : "none",
                                                        fontSize: 11,
                                                        fontFamily: C.mono,
                                                        color: C.sub,
                                                        lineHeight: 1.65,
                                                        background:
                                                            i === 0
                                                                ? "rgba(239,68,68,0.03)"
                                                                : "rgba(34,197,94,0.03)"
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            color:
                                                                i === 0
                                                                    ? C.red
                                                                    : C.green
                                                        }}
                                                    >
                                                        {i === 0
                                                            ? "−"
                                                            : "+"}{" "}
                                                    </span>
                                                    {r.output}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

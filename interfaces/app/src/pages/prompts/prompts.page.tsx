import { useState } from "react";
import { Plus, Copy, Trash2, Search } from "lucide-react";
import { C } from "@/lib/tokens";

interface Prompt {
    id: string;
    title: string;
    content: string;
    tags: string[];
    saved: number;
    length: number;
}

const DEFAULT_PROMPTS: Prompt[] = [
    {
        id: "1",
        title: "Prompt title",
        content: "Hi there I am from giro on, i really want to be the best...",
        tags: ["coding", "inline", "outline"],
        saved: 22,
        length: 40
    },
    {
        id: "2",
        title: "Gorsunia DGs",
        content: "Gorsunia complete gorsunin dg sources...",
        tags: ["sprint", "backlog", "outline"],
        saved: 21,
        length: 44
    },
    {
        id: "3",
        title: "User interface",
        content: "Create a beautiful user interface for...",
        tags: ["inline", "outline"],
        saved: 18,
        length: 22
    },
    {
        id: "4",
        title: "Prompt title",
        content: "Extended prompt content for advanced use cases...",
        tags: ["coding", "outline"],
        saved: 22,
        length: 9
    },
    {
        id: "5",
        title: "Garut",
        content: "Garut complete garut sources for comprehensive analysis...",
        tags: ["coding", "inline"],
        saved: 12,
        length: 22
    },
    {
        id: "6",
        title: "save folders",
        content: "Organize and save folder structures efficiently...",
        tags: ["outline"],
        saved: 9,
        length: 22
    }
];

const SYSTEM_PROMPTS = [
    "You are a helpful coding assistant.",
    "You are a professional technical writer.",
    "You are a concise summarizer."
];

const ALL_TAGS = [
    "coding",
    "inline",
    "outline",
    "sprint",
    "backlog",
    "creative",
    "analysis"
];

export function PromptsPage() {
    const [prompts, setPrompts] = useState(DEFAULT_PROMPTS);
    const [selected, setSelected] = useState<Prompt | null>(DEFAULT_PROMPTS[0]);
    const [search, setSearch] = useState("");
    const [editContent, setEditContent] = useState(DEFAULT_PROMPTS[0].content);
    const [editTitle, setEditTitle] = useState(DEFAULT_PROMPTS[0].title);

    const filtered = prompts.filter(
        p =>
            !search ||
            p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.content.toLowerCase().includes(search.toLowerCase())
    );

    const select = (p: Prompt) => {
        setSelected(p);
        setEditContent(p.content);
        setEditTitle(p.title);
    };

    const duplicate = (p: Prompt) => {
        const copy = {
            ...p,
            id: Date.now().toString(),
            title: p.title + " copy"
        };
        setPrompts(prev => [...prev, copy]);
    };

    const remove = (id: string) => {
        setPrompts(prev => prev.filter(p => p.id !== id));
        if (selected?.id === id) setSelected(null);
    };

    const save = () => {
        if (!selected) return;
        setPrompts(prev =>
            prev.map(p =>
                p.id === selected.id
                    ? { ...p, title: editTitle, content: editContent }
                    : p
            )
        );
    };

    return (
        <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
            {/* Left: list */}
            <div
                style={{
                    width: 220,
                    flexShrink: 0,
                    borderRight: `1px solid ${C.border}`,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: "8px 10px",
                        borderBottom: `1px solid ${C.border}`,
                        display: "flex",
                        gap: 5,
                        alignItems: "center"
                    }}
                >
                    <Search size={11} color={C.dim} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search…"
                        style={{
                            flex: 1,
                            background: "none",
                            border: "none",
                            outline: "none",
                            fontSize: 11,
                            color: C.text,
                            fontFamily: C.sans
                        }}
                    />
                    <button
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: C.dim,
                            fontSize: 10
                        }}
                    >
                        <Plus size={11} />
                        New prompt
                    </button>
                </div>

                {/* System prompts section */}
                <div
                    style={{
                        padding: "6px 0",
                        borderBottom: `1px solid ${C.border}`
                    }}
                >
                    <div
                        style={{
                            padding: "3px 10px 5px",
                            fontSize: 9,
                            color: C.dim,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em"
                        }}
                    >
                        All prompts
                    </div>
                    {["All prompts", "Prompt prompts"].map(label => (
                        <button
                            key={label}
                            style={{
                                width: "100%",
                                padding: "5px 10px",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: C.dim,
                                fontSize: 11,
                                textAlign: "left",
                                fontFamily: C.sans
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Prompt list */}
                <div style={{ flex: 1, overflow: "auto" }}>
                    {filtered.map(p => (
                        <button
                            key={p.id}
                            onClick={() => select(p)}
                            style={{
                                width: "100%",
                                padding: "8px 10px",
                                textAlign: "left",
                                background:
                                    selected?.id === p.id ? C.surface2 : "none",
                                border: "none",
                                borderBottom: `1px solid ${C.border}`,
                                cursor: "pointer",
                                display: "flex",
                                flexDirection: "column",
                                gap: 3
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between"
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 11,
                                        color: C.text,
                                        fontWeight: 500
                                    }}
                                >
                                    {p.title}
                                </span>
                                <div style={{ display: "flex", gap: 3 }}>
                                    {p.tags.slice(0, 2).map(t => (
                                        <span
                                            key={t}
                                            style={{
                                                fontSize: 8,
                                                color: C.dim,
                                                background: C.surface3,
                                                border: `1px solid ${C.border2}`,
                                                padding: "1px 4px",
                                                borderRadius: 3
                                            }}
                                        >
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <span
                                style={{
                                    fontSize: 10,
                                    color: C.dim,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap"
                                }}
                            >
                                {p.content.slice(0, 55)}…
                            </span>
                            <div
                                style={{
                                    display: "flex",
                                    gap: 8,
                                    fontSize: 9,
                                    color: C.dimmer
                                }}
                            >
                                <span>saved {p.saved}+</span>
                                <span>len {p.length}+</span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div
                    style={{
                        padding: "6px 10px",
                        borderTop: `1px solid ${C.border}`,
                        fontSize: 9,
                        color: C.dim,
                        fontFamily: C.mono
                    }}
                >
                    [prompts] {prompts.length} saved · {SYSTEM_PROMPTS.length}{" "}
                    system prompts · 12 templates · 14 chains
                </div>
            </div>

            {/* Middle: editor */}
            {selected ? (
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        borderRight: `1px solid ${C.border}`
                    }}
                >
                    <div
                        style={{
                            padding: "8px 12px",
                            borderBottom: `1px solid ${C.border}`,
                            display: "flex",
                            alignItems: "center",
                            gap: 8
                        }}
                    >
                        <input
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            style={{
                                flex: 1,
                                background: "none",
                                border: "none",
                                outline: "none",
                                fontSize: 13,
                                fontWeight: 500,
                                color: C.text,
                                fontFamily: C.sans
                            }}
                        />
                        <button
                            onClick={save}
                            style={{
                                padding: "4px 10px",
                                background: C.blue,
                                border: "none",
                                borderRadius: 5,
                                color: "white",
                                fontSize: 11,
                                cursor: "pointer"
                            }}
                        >
                            Save
                        </button>
                    </div>

                    <div
                        style={{
                            padding: "6px 12px 4px",
                            fontSize: 9,
                            color: C.dim,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em"
                        }}
                    >
                        Prompt title
                    </div>

                    <textarea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        style={{
                            flex: 1,
                            background: "none",
                            border: "none",
                            outline: "none",
                            resize: "none",
                            padding: "4px 12px 12px",
                            fontSize: 12,
                            color: C.sub,
                            lineHeight: 1.65,
                            fontFamily: C.sans
                        }}
                    />

                    <div
                        style={{
                            padding: "8px 12px",
                            borderTop: `1px solid ${C.border}`,
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                            flexWrap: "wrap"
                        }}
                    >
                        <span style={{ fontSize: 10, color: C.dim }}>
                            Prompt clause
                        </span>
                        <div
                            style={{
                                display: "flex",
                                gap: 4,
                                flex: 1,
                                flexWrap: "wrap"
                            }}
                        >
                            {selected.tags.map(t => (
                                <span
                                    key={t}
                                    style={{
                                        fontSize: 9,
                                        color: C.sub,
                                        background: C.surface2,
                                        border: `1px solid ${C.border2}`,
                                        padding: "2px 6px",
                                        borderRadius: 4
                                    }}
                                >
                                    {t}
                                </span>
                            ))}
                        </div>
                        <span
                            style={{
                                fontSize: 9,
                                color: C.dim,
                                fontFamily: C.mono
                            }}
                        >
                            Turls do alldo →
                        </span>
                    </div>

                    {/* Actions bar */}
                    <div
                        style={{
                            padding: "6px 12px",
                            borderTop: `1px solid ${C.border}`,
                            display: "flex",
                            gap: 6
                        }}
                    >
                        {[
                            {
                                icon: <Copy size={10} />,
                                label: "Duplicate",
                                action: () => duplicate(selected)
                            },
                            {
                                icon: <Trash2 size={10} />,
                                label: "Delete",
                                action: () => remove(selected.id)
                            }
                        ].map(a => (
                            <button
                                key={a.label}
                                onClick={a.action}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                    padding: "4px 9px",
                                    background: C.surface,
                                    border: `1px solid ${C.border2}`,
                                    borderRadius: 5,
                                    color: C.dim,
                                    fontSize: 10,
                                    cursor: "pointer"
                                }}
                            >
                                {a.icon}
                                {a.label}
                            </button>
                        ))}
                        <div style={{ flex: 1 }} />
                        <span
                            style={{
                                fontSize: 9,
                                color: C.dim,
                                fontFamily: C.mono
                            }}
                        >
                            len {editContent.length}+
                        </span>
                    </div>
                </div>
            ) : (
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: C.dim,
                        fontSize: 12
                    }}
                >
                    Select a prompt to edit
                </div>
            )}

            {/* Right: tag filter + stats */}
            <div
                style={{
                    width: 160,
                    flexShrink: 0,
                    borderLeft: `1px solid ${C.border}`,
                    padding: "12px 10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12
                }}
            >
                <div>
                    <div
                        style={{
                            fontSize: 9,
                            color: C.dim,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            marginBottom: 8
                        }}
                    >
                        Tags
                    </div>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 3
                        }}
                    >
                        {ALL_TAGS.map(t => (
                            <label
                                key={t}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    cursor: "pointer"
                                }}
                            >
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    style={{
                                        accentColor: C.blue,
                                        width: 11,
                                        height: 11
                                    }}
                                />
                                <span style={{ fontSize: 10, color: C.sub }}>
                                    {t}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                <div
                    style={{
                        borderTop: `1px solid ${C.border}`,
                        paddingTop: 10
                    }}
                >
                    <div
                        style={{
                            fontSize: 9,
                            color: C.dim,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            marginBottom: 6
                        }}
                    >
                        Stats
                    </div>
                    {[
                        { l: "Total", v: String(prompts.length) },
                        { l: "Saved", v: "22+" },
                        { l: "Len avg", v: "28" }
                    ].map(s => (
                        <div
                            key={s.l}
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 4
                            }}
                        >
                            <span style={{ fontSize: 10, color: C.dim }}>
                                {s.l}
                            </span>
                            <span
                                style={{
                                    fontSize: 10,
                                    color: C.sub,
                                    fontFamily: C.mono
                                }}
                            >
                                {s.v}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

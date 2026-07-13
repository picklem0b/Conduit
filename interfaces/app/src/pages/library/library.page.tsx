import { useRef } from "react";
import {
    Search,
    LayoutGrid,
    List,
    Upload,
    FolderPlus,
    Plus
} from "lucide-react";
import { C } from "@/lib/tokens";
import { useLibraryStore } from "./library.store";

const SIDEBAR_ITEMS = [
    { label: "Images", tab: "images" as const },
    { label: "Documents", tab: "documents" as const },
    { label: "All files", tab: "all" as const },
    { label: "User files", tab: "user-files" as const }
];

// Fake coloured image placeholder tiles matching the reference
const IMAGE_COLORS = [
    "#1a1a2e",
    "#162032",
    "#1a2a1a",
    "#2a1a1a",
    "#1a1a2e",
    "#2a2a1a",
    "#1a2a2a",
    "#2a1a2a"
];

export function LibraryPage() {
    const {
        tab,
        setTab,
        viewMode,
        setViewMode,
        search,
        setSearch,
        files,
        selected,
        toggleSelect
    } = useLibraryStore();
    const uploadRef = useRef<HTMLInputElement>(null);

    const filtered = files.filter(
        f => !search || f.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
            {/* Sidebar */}
            <div
                style={{
                    width: 180,
                    flexShrink: 0,
                    borderRight: `1px solid ${C.border}`,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                }}
            >
                <div
                    style={{
                        padding: "10px 10px 6px",
                        borderBottom: `1px solid ${C.border}`
                    }}
                >
                    <button
                        style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 8px",
                            background: C.surface,
                            border: `1px solid ${C.border2}`,
                            borderRadius: 5,
                            color: C.dim,
                            fontSize: 11,
                            cursor: "pointer"
                        }}
                    >
                        <Search size={11} color={C.dim} />
                        Search
                    </button>
                </div>
                <div style={{ flex: 1, padding: "6px 0" }}>
                    {SIDEBAR_ITEMS.map(item => (
                        <button
                            key={item.tab}
                            onClick={() => setTab(item.tab)}
                            style={{
                                width: "100%",
                                padding: "6px 12px",
                                background:
                                    tab === item.tab ? C.surface2 : "none",
                                border: "none",
                                cursor: "pointer",
                                color: tab === item.tab ? C.text : C.dim,
                                fontSize: 12,
                                textAlign: "left" as const,
                                borderRadius: 4,
                                margin: "1px 4px",
                                maxWidth: "calc(100% - 8px)",
                                transition: "all 0.12s"
                            }}
                        >
                            {item.label}
                        </button>
                    ))}
                    <div
                        style={{
                            borderTop: `1px solid ${C.border}`,
                            margin: "6px 0",
                            padding: "6px 0"
                        }}
                    >
                        <button
                            style={{
                                width: "calc(100% - 8px)",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "5px 12px",
                                margin: "0 4px",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: C.dim,
                                fontSize: 11
                            }}
                        >
                            <FolderPlus size={11} />
                            New folder
                        </button>
                    </div>
                </div>
                {/* Footer stats */}
                <div
                    style={{
                        padding: "8px 12px",
                        borderTop: `1px solid ${C.border}`,
                        fontSize: 9,
                        color: C.dim,
                        fontFamily: C.mono
                    }}
                >
                    47 items · 1 folder · 26MB load
                </div>
            </div>

            {/* Main */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                }}
            >
                {/* Toolbar */}
                <div
                    style={{
                        padding: "8px 14px",
                        borderBottom: `1px solid ${C.border}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 8
                    }}
                >
                    {/* Search */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                            background: C.surface,
                            border: `1px solid ${C.border2}`,
                            borderRadius: 6,
                            padding: "5px 9px",
                            flex: 1,
                            maxWidth: 240
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
                                color: C.text
                            }}
                        />
                    </div>

                    {/* Sort */}
                    <select
                        style={{
                            background: C.surface,
                            border: `1px solid ${C.border2}`,
                            borderRadius: 5,
                            padding: "5px 8px",
                            color: C.sub,
                            fontSize: 11,
                            cursor: "pointer"
                        }}
                    >
                        <option>Date: latest</option>
                        <option>Name A-Z</option>
                        <option>Size</option>
                    </select>

                    <div style={{ flex: 1 }} />

                    {/* View toggle */}
                    <div
                        style={{
                            display: "flex",
                            background: C.surface2,
                            border: `1px solid ${C.border2}`,
                            borderRadius: 5,
                            overflow: "hidden"
                        }}
                    >
                        {(
                            [
                                ["grid", LayoutGrid],
                                ["list", List]
                            ] as const
                        ).map(([mode, Icon]) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                style={{
                                    padding: "5px 7px",
                                    background:
                                        viewMode === mode ? C.surface3 : "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: viewMode === mode ? C.text : C.dim,
                                    display: "flex",
                                    alignItems: "center"
                                }}
                            >
                                <Icon size={13} />
                            </button>
                        ))}
                    </div>

                    {/* Upload */}
                    <input
                        ref={uploadRef}
                        type="file"
                        multiple
                        style={{ display: "none" }}
                    />
                    <button
                        onClick={() => uploadRef.current?.click()}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "5px 10px",
                            background: C.surface,
                            border: `1px solid ${C.border2}`,
                            borderRadius: 5,
                            color: C.sub,
                            fontSize: 11,
                            cursor: "pointer"
                        }}
                    >
                        <Upload size={11} />
                        Upload
                    </button>
                    <button
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "5px 10px",
                            background: C.blue,
                            border: "none",
                            borderRadius: 5,
                            color: "white",
                            fontSize: 11,
                            cursor: "pointer"
                        }}
                    >
                        <Plus size={11} />
                        New Folder
                    </button>
                </div>

                {/* Content */}
                <div
                    style={{ flex: 1, overflow: "auto", padding: "12px 14px" }}
                >
                    {viewMode === "grid" ? (
                        <>
                            {/* Image grid — fake coloured tiles matching reference */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(auto-fill, minmax(120px, 1fr))",
                                    gap: 6,
                                    marginBottom: 16
                                }}
                            >
                                {IMAGE_COLORS.slice(
                                    0,
                                    tab === "images" ? 8 : 4
                                ).map((color, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            aspectRatio: "1",
                                            background: color,
                                            borderRadius: 7,
                                            border: `1px solid ${C.border2}`,
                                            cursor: "pointer",
                                            transition: "border-color 0.12s",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }}
                                        onMouseEnter={e =>
                                            (e.currentTarget.style.borderColor =
                                                C.border3)
                                        }
                                        onMouseLeave={e =>
                                            (e.currentTarget.style.borderColor =
                                                C.border2)
                                        }
                                    >
                                        <span
                                            style={{
                                                fontSize: 8,
                                                color: "#ffffff22"
                                            }}
                                        >
                                            img
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Drop zone */}
                            <div
                                onClick={() => uploadRef.current?.click()}
                                style={{
                                    border: `1px dashed ${C.border2}`,
                                    borderRadius: 8,
                                    padding: "24px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 8,
                                    cursor: "pointer",
                                    transition: "border-color 0.12s"
                                }}
                                onMouseEnter={e =>
                                    (e.currentTarget.style.borderColor =
                                        C.border3)
                                }
                                onMouseLeave={e =>
                                    (e.currentTarget.style.borderColor =
                                        C.border2)
                                }
                            >
                                {/* Conduit logo small */}
                                <svg
                                    width="24"
                                    height="18"
                                    viewBox="0 0 80 60"
                                    fill="none"
                                >
                                    <path
                                        d="M4 14 H28 Q44 14 44 30"
                                        stroke={C.dim}
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M4 30 H44"
                                        stroke={C.dim}
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                    />
                                    <path
                                        d="M4 46 H28 Q44 46 44 30"
                                        stroke={C.dim}
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <line
                                        x1="48"
                                        y1="10"
                                        x2="48"
                                        y2="50"
                                        stroke={C.dim}
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                    />
                                    <path
                                        d="M48 30 H76"
                                        stroke={C.dim}
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <span style={{ fontSize: 11, color: C.dim }}>
                                    Drop files here or from a conversation
                                </span>
                                <button
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 5,
                                        padding: "5px 12px",
                                        background: C.surface,
                                        border: `1px solid ${C.border2}`,
                                        borderRadius: 5,
                                        color: C.sub,
                                        fontSize: 11,
                                        cursor: "pointer"
                                    }}
                                >
                                    <Plus size={10} />
                                    New folder
                                </button>
                            </div>
                        </>
                    ) : (
                        /* List view */
                        <div
                            style={{ display: "flex", flexDirection: "column" }}
                        >
                            {/* Header */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 80px 100px 100px",
                                    padding: "5px 10px",
                                    borderBottom: `1px solid ${C.border}`,
                                    gap: 10
                                }}
                            >
                                {["Name", "Type", "Size", "Date"].map(h => (
                                    <span
                                        key={h}
                                        style={{
                                            fontSize: 9,
                                            color: C.dim,
                                            fontWeight: 600,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.06em"
                                        }}
                                    >
                                        {h}
                                    </span>
                                ))}
                            </div>
                            {filtered.map(f => (
                                <div
                                    key={f.id}
                                    onClick={() => toggleSelect(f.id)}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "1fr 80px 100px 100px",
                                        padding: "8px 10px",
                                        borderBottom: `1px solid ${C.border}`,
                                        gap: 10,
                                        alignItems: "center",
                                        cursor: "pointer",
                                        background: selected.has(f.id)
                                            ? C.surface2
                                            : "none",
                                        transition: "background 0.1s"
                                    }}
                                >
                                    <span
                                        style={{ fontSize: 12, color: C.text }}
                                    >
                                        {f.name}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 9,
                                            color: C.dim,
                                            textTransform: "uppercase" as const,
                                            fontFamily: C.mono
                                        }}
                                    >
                                        {f.type}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 9,
                                            color: C.dim,
                                            fontFamily: C.mono
                                        }}
                                    >
                                        {f.size}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 9,
                                            color: C.dim,
                                            fontFamily: C.mono
                                        }}
                                    >
                                        {f.date}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

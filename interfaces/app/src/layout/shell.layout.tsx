import { useEffect, type ReactNode } from "react";
import {
    MessageSquare,
    Search,
    Users,
    Settings,
    BarChart2,
    GitCompare,
    FlaskConical,
    Database,
    Globe,
    BookOpen,
    FolderOpen,
    Activity,
    Cpu,
    FileText,
    Zap,
    History,
    Image,
    Layers,
    Code2
} from "lucide-react";
import { C, SHELL } from "@/lib/tokens";
import { useAppStore, type WorkspaceId } from "@/store/app.store";
import { LogoMark, LogoWordmark } from "@/components/ui/logo.ui";
import { TerminalPanel } from "./terminal.panel";
import { CommandPalette } from "./command.palette";

// ── Icon rail items (leftmost narrow strip) ───────────────────────────────────
const RAIL_ITEMS: { icon: ReactNode; ws: WorkspaceId; tip: string }[] = [
    { icon: <MessageSquare size={16} />, ws: "chat", tip: "Chat" },
    { icon: <Search size={16} />, ws: "osint", tip: "OSINT" },
    { icon: <Users size={16} />, ws: "compare", tip: "Compare" },
    { icon: <Settings size={16} />, ws: "settings", tip: "Settings" }
];

// ── Sidebar sections matching Image 4 exactly ─────────────────────────────────
const SESSIONS = [
    { label: "Python script debugging", model: "gpt-4o" },
    { label: "Project brainstorm", model: "claude-3" },
    { label: "Project script-development…", model: "gpt-4o" }
];

const WORKSPACE_ITEMS: { label: string; icon: ReactNode; ws: WorkspaceId }[] = [
    { label: "Benchmark", icon: <BarChart2 size={14} />, ws: "benchmark" },
    { label: "Compare", icon: <GitCompare size={14} />, ws: "compare" },
    {
        label: "Experiments",
        icon: <FlaskConical size={14} />,
        ws: "experiments"
    },
    { label: "RAG", icon: <Database size={14} />, ws: "rag" },
    { label: "Prompts", icon: <BookOpen size={14} />, ws: "prompts" }
];

const TOOL_ITEMS: { label: string; icon: ReactNode; ws: WorkspaceId }[] = [
    { label: "OSINT", icon: <Globe size={14} />, ws: "osint" },
    { label: "API Tester", icon: <Zap size={14} />, ws: "tester" },
    { label: "Tool Caller", icon: <Cpu size={14} />, ws: "benchmark" },
    { label: "Generate", icon: <Image size={14} />, ws: "media-generate" },
    { label: "Canvas", icon: <Layers size={14} />, ws: "media-canvas" },
    { label: "Code", icon: <Code2 size={14} />, ws: "media-code" }
];

// ── Header toolbar icons (top-right of main area) ────────────────────────────
function HeaderToolbar() {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {[
                <BarChart2 size={14} />,
                <FileText size={14} />,
                <Activity size={14} />,
                <Globe size={14} />,
                <Settings size={14} />
            ].map((icon, i) => (
                <button
                    key={i}
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: C.dim,
                        padding: "5px 6px",
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                        transition: "color 0.15s"
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = C.sub)}
                    onMouseLeave={e => (e.currentTarget.style.color = C.dim)}
                >
                    {icon}
                </button>
            ))}
        </div>
    );
}

// ── Shell ─────────────────────────────────────────────────────────────────────
export function ShellLayout({ children }: { children: ReactNode }) {
    const {
        workspace,
        setWorkspace,
        commandOpen,
        setCommandOpen,
        terminalOpen,
        version
    } = useAppStore();

    // Keyboard shortcut — Cmd/Ctrl+K opens command palette
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setCommandOpen(!commandOpen);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [commandOpen, setCommandOpen]);

    return (
        <div
            style={{
                display: "flex",
                height: "100vh",
                width: "100vw",
                background: C.bg,
                color: C.text,
                fontFamily: C.sans,
                overflow: "hidden",
                position: "relative"
            }}
        >
            {/* ── Icon rail ── */}
            <div
                style={{
                    width: SHELL.iconRailW,
                    flexShrink: 0,
                    borderRight: `1px solid ${C.border}`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    paddingTop: 10,
                    gap: 4,
                    background: C.bg,
                    zIndex: 10
                }}
            >
                {/* Logo at top */}
                <div
                    style={{
                        padding: "6px 0 12px",
                        borderBottom: `1px solid ${C.border}`,
                        width: "100%",
                        display: "flex",
                        justifyContent: "center"
                    }}
                >
                    <LogoMark size={18} />
                </div>

                {RAIL_ITEMS.map(item => (
                    <button
                        key={item.ws}
                        onClick={() => setWorkspace(item.ws)}
                        title={item.tip}
                        style={{
                            background:
                                workspace === item.ws ? C.surface2 : "none",
                            border: "none",
                            cursor: "pointer",
                            color: workspace === item.ws ? C.text : C.dim,
                            padding: "8px",
                            borderRadius: 5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 30,
                            height: 30,
                            transition: "all 0.15s"
                        }}
                        onMouseEnter={e => {
                            if (workspace !== item.ws)
                                e.currentTarget.style.color = C.sub;
                        }}
                        onMouseLeave={e => {
                            if (workspace !== item.ws)
                                e.currentTarget.style.color = C.dim;
                        }}
                    >
                        {item.icon}
                    </button>
                ))}

                <div style={{ flex: 1 }} />

                {/* Bottom: settings + avatar */}
                <button
                    onClick={() => setWorkspace("settings")}
                    title="Settings"
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: C.dim,
                        padding: "8px",
                        borderRadius: 5,
                        display: "flex",
                        marginBottom: 4
                    }}
                >
                    <Settings size={15} />
                </button>
                <div
                    style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, #22c55e, #3b82f6)`,
                        marginBottom: 10,
                        flexShrink: 0,
                        cursor: "pointer"
                    }}
                />
            </div>

            {/* ── Sidebar ── */}
            <div
                style={{
                    width: SHELL.sidebarW,
                    flexShrink: 0,
                    borderRight: `1px solid ${C.border}`,
                    background: C.bg,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                }}
            >
                {/* Wordmark + version */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px 10px",
                        borderBottom: `1px solid ${C.border}`,
                        flexShrink: 0
                    }}
                >
                    <LogoWordmark size={18} />
                    <span
                        style={{
                            fontSize: 10,
                            color: C.dim,
                            fontFamily: C.mono,
                            background: C.surface2,
                            border: `1px solid ${C.border2}`,
                            padding: "2px 6px",
                            borderRadius: 4
                        }}
                    >
                        {version}
                    </span>
                </div>

                {/* Search / command bar — matches Image 4 */}
                <div
                    style={{
                        padding: "8px 10px",
                        borderBottom: `1px solid ${C.border}`,
                        flexShrink: 0
                    }}
                >
                    <button
                        onClick={() => setCommandOpen(true)}
                        style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                            background: C.surface,
                            border: `1px solid ${C.border2}`,
                            borderRadius: 6,
                            padding: "7px 10px",
                            color: C.dim,
                            fontSize: 12,
                            cursor: "pointer",
                            fontFamily: C.sans,
                            textAlign: "left"
                        }}
                    >
                        <Search size={12} color={C.dim} />
                        Search or run a command…
                    </button>
                </div>

                {/* Scrollable sidebar content */}
                <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
                    {/* Sessions */}
                    <SidebarSection
                        label="SESSIONS"
                        action={
                            <button
                                onClick={() => setWorkspace("chat")}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: C.dim,
                                    display: "flex"
                                }}
                            >
                                <span style={{ fontSize: 16, lineHeight: 1 }}>
                                    +
                                </span>
                            </button>
                        }
                    >
                        {SESSIONS.map((s, i) => (
                            <SidebarItem
                                key={i}
                                icon={<MessageSquare size={13} />}
                                label={s.label}
                                badge={s.model}
                                active={false}
                                onClick={() => setWorkspace("chat")}
                            />
                        ))}
                    </SidebarSection>

                    {/* Workspace */}
                    <SidebarSection label="WORKSPACE">
                        {WORKSPACE_ITEMS.map(item => (
                            <SidebarItem
                                key={item.ws}
                                icon={item.icon}
                                label={item.label}
                                active={workspace === item.ws}
                                onClick={() => setWorkspace(item.ws)}
                            />
                        ))}
                    </SidebarSection>

                    {/* Tools */}
                    <SidebarSection label="TOOLS">
                        {TOOL_ITEMS.map(item => (
                            <SidebarItem
                                key={item.ws}
                                icon={item.icon}
                                label={item.label}
                                active={workspace === item.ws}
                                onClick={() => setWorkspace(item.ws)}
                            />
                        ))}
                    </SidebarSection>
                </div>

                {/* Sidebar bottom */}
                <div
                    style={{
                        borderTop: `1px solid ${C.border}`,
                        padding: "8px 10px",
                        flexShrink: 0
                    }}
                >
                    <SidebarItem
                        icon={<Settings size={13} />}
                        label="Settings"
                        active={workspace === "settings"}
                        onClick={() => setWorkspace("settings")}
                    />
                    <div style={{ height: 6 }} />
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 8px"
                        }}
                    >
                        <div
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: C.green
                            }}
                        />
                        <span style={{ fontSize: 11, color: C.dim }}>
                            Provider health
                        </span>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 8px",
                            cursor: "pointer"
                        }}
                    >
                        <Users size={12} color={C.dim} />
                        <span style={{ fontSize: 11, color: C.dim }}>
                            User profile
                        </span>
                        <History
                            size={10}
                            color={C.dimmer}
                            style={{ marginLeft: "auto" }}
                        />
                    </div>
                </div>
            </div>

            {/* ── Main area: content + terminal ── */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    minWidth: 0
                }}
            >
                {/* Header bar */}
                <div
                    style={{
                        height: 40,
                        borderBottom: `1px solid ${C.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 16px",
                        flexShrink: 0,
                        background: C.bg
                    }}
                >
                    <span style={{ fontSize: 13, color: C.sub }}>
                        {workspaceLabel(workspace)}
                    </span>
                    <HeaderToolbar />
                </div>

                {/* Page content */}
                <div
                    style={{
                        flex: 1,
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column"
                    }}
                >
                    {children}
                </div>

                {/* Terminal panel */}
                {terminalOpen && <TerminalPanel />}
            </div>

            {/* Command palette overlay */}
            {commandOpen && <CommandPalette />}
        </div>
    );
}

// ── Sidebar primitives ────────────────────────────────────────────────────────
function SidebarSection({
    label,
    children,
    action
}: {
    label: string;
    children: ReactNode;
    action?: ReactNode;
}) {
    return (
        <div style={{ marginBottom: 8 }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "5px 14px 3px"
                }}
            >
                <span
                    style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: C.dim,
                        letterSpacing: "0.08em"
                    }}
                >
                    {label}
                </span>
                {action}
            </div>
            {children}
        </div>
    );
}

function SidebarItem({
    icon,
    label,
    active,
    onClick,
    badge
}: {
    icon: ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
    badge?: string;
}) {
    return (
        <button
            onClick={onClick}
            style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px 6px 14px",
                background: active ? C.surface2 : "none",
                border: "none",
                cursor: "pointer",
                color: active ? C.text : C.dim,
                fontSize: 13,
                textAlign: "left" as const,
                borderRadius: 4,
                margin: "1px 4px",
                width: "calc(100% - 8px)",
                transition: "all 0.12s"
            }}
            onMouseEnter={e => {
                if (!active) e.currentTarget.style.color = C.sub;
            }}
            onMouseLeave={e => {
                if (!active) e.currentTarget.style.color = C.dim;
            }}
        >
            <span style={{ color: active ? C.sub : C.dim, flexShrink: 0 }}>
                {icon}
            </span>
            <span
                style={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                }}
            >
                {label}
            </span>
            {badge && (
                <span
                    style={{
                        fontSize: 9,
                        color: C.dim,
                        fontFamily: C.mono,
                        background: C.surface3,
                        border: `1px solid ${C.border2}`,
                        padding: "1px 5px",
                        borderRadius: 3,
                        flexShrink: 0
                    }}
                >
                    {badge}
                </span>
            )}
        </button>
    );
}

function workspaceLabel(ws: WorkspaceId): string {
    const map: Record<WorkspaceId, string> = {
        chat: "Chat Workspace.",
        compare: "Model Comparison Workspace.",
        benchmark: "Benchmark Workspace.",
        experiments: "Prompt Experiments Workspace.",
        rag: "RAG Workspace.",
        osint: "OSINT",
        prompts: "Prompt Library / saved prompts",
        models: "Local Models",
        tester: "API Tester",
        library: "Library / Images",
        projects: "Projects",
        runtime: "Runtime",
        settings: "Settings",
        changelog: "Changelog",
        "media-generate": "Media · Generate",
        "media-canvas": "Media · Canvas",
        "media-code": "Media · Code"
    };
    return map[ws] ?? ws;
}

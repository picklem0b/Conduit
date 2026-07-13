import { useState } from "react";
import { Plus, X, ArrowRight } from "lucide-react";
import { C } from "@/lib/tokens";
import { useProjectsStore } from "./projects.store";
import { useAppStore } from "@/store/app.store";

function ModelChip({ model }: { model: string }) {
    const color = model.includes("claude")
        ? "#e8703a"
        : model.includes("gpt")
          ? "#74aa9c"
          : C.dim;
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 9,
                fontFamily: C.mono,
                padding: "2px 6px",
                background: color + "22",
                border: `1px solid ${color}44`,
                borderRadius: 4,
                color,
                flexShrink: 0
            }}
        >
            <span
                style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: color,
                    flexShrink: 0
                }}
            />
            {model}
        </span>
    );
}

function ProjectCard({
    project,
    selected,
    onClick
}: {
    project: ReturnType<typeof useProjectsStore>["projects"][0];
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <div
            onClick={onClick}
            style={{
                background: selected ? C.surface2 : C.surface,
                border: `1px solid ${selected ? C.border3 : C.border}`,
                borderRadius: 9,
                padding: "14px 16px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                transition: "all 0.12s"
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                    style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: C.text,
                        flex: 1
                    }}
                >
                    {project.name}
                </span>
                <span style={{ fontSize: 9, color: C.dim }}>project name</span>
                <button
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: C.dim
                    }}
                >
                    <X size={12} />
                </button>
            </div>

            {project.description && (
                <p
                    style={{
                        fontSize: 11,
                        color: C.dim,
                        lineHeight: 1.5,
                        margin: 0
                    }}
                >
                    {project.description.slice(0, 100)}
                </p>
            )}

            <div
                style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    alignItems: "center"
                }}
            >
                <ModelChip model={project.model} />
                {project.cascade && (
                    <span
                        style={{
                            fontSize: 9,
                            padding: "2px 5px",
                            borderRadius: 3,
                            background: C.blueDim,
                            color: C.blue,
                            border: `1px solid ${C.blueBdr}`
                        }}
                    >
                        cascade
                    </span>
                )}
                {project.collaborators?.map(c => (
                    <span key={c} style={{ fontSize: 9, color: C.dim }}>
                        {c}
                    </span>
                ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 9, color: C.dim }}>
                    {project.lastActive}
                </span>
                <div style={{ flex: 1 }} />
                <button
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "4px 9px",
                        background: C.surface3,
                        border: `1px solid ${C.border2}`,
                        borderRadius: 5,
                        color: C.sub,
                        fontSize: 10,
                        cursor: "pointer"
                    }}
                >
                    Start conversation
                    <ArrowRight size={9} />
                </button>
            </div>
        </div>
    );
}

export function ProjectsPage() {
    const { projects, selected, setSelected, addProject, deleteProject } =
        useProjectsStore();
    const { pushTerminalLine } = useAppStore();
    const [showNew, setShowNew] = useState(false);
    const [newName, setNewName] = useState("");

    const selectedProject = projects.find(p => p.id === selected);

    const create = () => {
        if (!newName.trim()) return;
        addProject({
            name: newName,
            model: "claude-sonnet-4-6",
            cascade: true,
            profile: "balanced",
            lastActive: "just now",
            messageCount: 0
        });
        pushTerminalLine({
            text: `[projects] created "${newName}"`,
            type: "success"
        });
        setNewName("");
        setShowNew(false);
    };

    return (
        <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
            {/* Left: project list */}
            <div
                style={{
                    flex: 1,
                    borderRight: `1px solid ${C.border}`,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: "10px 14px",
                        borderBottom: `1px solid ${C.border}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 8
                    }}
                >
                    <span
                        style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: C.text,
                            flex: 1
                        }}
                    >
                        Projects
                    </span>
                    <button
                        onClick={() => setShowNew(v => !v)}
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
                        New project
                    </button>
                </div>

                {/* New project form */}
                {showNew && (
                    <div
                        style={{
                            padding: "10px 14px",
                            borderBottom: `1px solid ${C.border}`,
                            display: "flex",
                            gap: 6
                        }}
                    >
                        <input
                            autoFocus
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && create()}
                            placeholder="Project name…"
                            style={{
                                flex: 1,
                                background: C.surface,
                                border: `1px solid ${C.border2}`,
                                borderRadius: 5,
                                padding: "6px 9px",
                                color: C.text,
                                fontSize: 12,
                                outline: "none"
                            }}
                        />
                        <button
                            onClick={create}
                            style={{
                                padding: "6px 12px",
                                background: C.blue,
                                border: "none",
                                borderRadius: 5,
                                color: "white",
                                fontSize: 11,
                                cursor: "pointer"
                            }}
                        >
                            Create
                        </button>
                        <button
                            onClick={() => setShowNew(false)}
                            style={{
                                padding: "6px 8px",
                                background: C.surface,
                                border: `1px solid ${C.border2}`,
                                borderRadius: 5,
                                color: C.dim,
                                cursor: "pointer"
                            }}
                        >
                            <X size={12} />
                        </button>
                    </div>
                )}

                {/* Project grid — 2 columns matching reference */}
                <div
                    style={{
                        flex: 1,
                        overflow: "auto",
                        padding: "12px 14px",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 10,
                        alignContent: "start"
                    }}
                >
                    {projects.map(p => (
                        <ProjectCard
                            key={p.id}
                            project={p}
                            selected={selected === p.id}
                            onClick={() => setSelected(p.id)}
                        />
                    ))}
                </div>

                {/* Footer */}
                <div
                    style={{
                        padding: "6px 14px",
                        borderTop: `1px solid ${C.border}`,
                        fontSize: 9,
                        color: C.dim,
                        fontFamily: C.mono
                    }}
                >
                    {projects.length} active · careful mode 3 projects · last
                    session: 1 min ago
                </div>
            </div>

            {/* Right: project detail */}
            {selectedProject ? (
                <div
                    style={{
                        width: 320,
                        flexShrink: 0,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden"
                    }}
                >
                    <div
                        style={{
                            padding: "12px 14px",
                            borderBottom: `1px solid ${C.border}`,
                            display: "flex",
                            alignItems: "center",
                            gap: 8
                        }}
                    >
                        <span
                            style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: C.text,
                                flex: 1
                            }}
                        >
                            {selectedProject.name}
                        </span>
                        <button
                            onClick={() => setSelected(null)}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: C.dim
                            }}
                        >
                            <X size={13} />
                        </button>
                    </div>
                    <div style={{ flex: 1, overflow: "auto", padding: "14px" }}>
                        <ProjectDetail project={selectedProject} />
                    </div>
                </div>
            ) : (
                <div
                    style={{
                        width: 280,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: C.dim,
                        fontSize: 12
                    }}
                >
                    Select a project
                </div>
            )}
        </div>
    );
}

function ProjectDetail({
    project
}: {
    project: ReturnType<typeof useProjectsStore>["projects"][0];
}) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
                { label: "Model", value: project.model },
                {
                    label: "Cascade",
                    value: project.cascade ? "enabled" : "disabled"
                },
                { label: "Profile", value: project.profile },
                { label: "Messages", value: String(project.messageCount) }
            ].map(r => (
                <div
                    key={r.label}
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        borderBottom: `1px solid ${C.border}`,
                        paddingBottom: 8
                    }}
                >
                    <span style={{ fontSize: 11, color: C.dim }}>
                        {r.label}
                    </span>
                    <span
                        style={{
                            fontSize: 11,
                            color: C.sub,
                            fontFamily: C.mono
                        }}
                    >
                        {r.value}
                    </span>
                </div>
            ))}
            {project.description && (
                <p style={{ fontSize: 12, color: C.dim, lineHeight: 1.6 }}>
                    {project.description}
                </p>
            )}
            <button
                style={{
                    width: "100%",
                    padding: "9px",
                    background: C.blue,
                    border: "none",
                    borderRadius: 7,
                    color: "white",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6
                }}
            >
                <ArrowRight size={12} />
                Start conversation
            </button>
        </div>
    );
}

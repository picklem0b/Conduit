import { create } from "zustand";

export type WorkspaceId =
    | "chat"
    | "compare"
    | "benchmark"
    | "experiments"
    | "rag"
    | "osint"
    | "prompts"
    | "models"
    | "tester"
    | "library"
    | "projects"
    | "runtime"
    | "settings"
    | "changelog"
    | "media-generate"
    | "media-canvas"
    | "media-code";

interface TerminalLine {
    id: string;
    text: string;
    type: "info" | "success" | "error" | "dim";
}

interface AppState {
    workspace: WorkspaceId;
    setWorkspace: (w: WorkspaceId) => void;

    terminalOpen: boolean;
    terminalTab: "terminal" | "api-log" | "event-stream" | "metrics";
    terminalLines: TerminalLine[];
    setTerminalOpen: (v: boolean) => void;
    setTerminalTab: (t: AppState["terminalTab"]) => void;
    pushTerminalLine: (line: Omit<TerminalLine, "id">) => void;
    clearTerminal: () => void;

    commandOpen: boolean;
    setCommandOpen: (v: boolean) => void;

    sidebarOpen: boolean;
    setSidebarOpen: (v: boolean) => void;

    version: string;
}

let _lineId = 0;

export const useAppStore = create<AppState>(set => ({
    workspace: "chat",
    setWorkspace: workspace => set({ workspace }),

    terminalOpen: true,
    terminalTab: "terminal",
    terminalLines: [{ id: "0", text: "Conduit v0.3.2 ready", type: "dim" }],
    setTerminalOpen: terminalOpen => set({ terminalOpen }),
    setTerminalTab: terminalTab => set({ terminalTab }),
    pushTerminalLine: line =>
        set(s => ({
            terminalLines: [
                ...s.terminalLines.slice(-200),
                { ...line, id: String(++_lineId) }
            ]
        })),
    clearTerminal: () => set({ terminalLines: [] }),

    commandOpen: false,
    setCommandOpen: commandOpen => set({ commandOpen }),

    sidebarOpen: true,
    setSidebarOpen: sidebarOpen => set({ sidebarOpen }),

    version: "v0.3.2"
}));

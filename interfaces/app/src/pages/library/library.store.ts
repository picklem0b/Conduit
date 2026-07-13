import { create } from "zustand";

export type ViewMode = "grid" | "list";
export type LibTab = "images" | "documents" | "all" | "user-files";

export interface LibFile {
    id: string;
    name: string;
    type: "image" | "doc" | "file";
    size: string;
    date: string;
    url?: string;
    thumb?: string;
}

interface LibState {
    tab: LibTab;
    viewMode: ViewMode;
    search: string;
    files: LibFile[];
    selected: Set<string>;
    setTab: (t: LibTab) => void;
    setViewMode: (v: ViewMode) => void;
    setSearch: (s: string) => void;
    toggleSelect: (id: string) => void;
    clearSelect: () => void;
}

const MOCK_FILES: LibFile[] = [
    {
        id: "1",
        name: "Dorgo Seminar",
        type: "image",
        size: "0.5 MB",
        date: "02.03.2021"
    },
    {
        id: "2",
        name: "Dorgo Seminar",
        type: "image",
        size: "0.1 MB",
        date: "02.03.2021"
    },
    {
        id: "3",
        name: "ebods.convm.set",
        type: "doc",
        size: "0.08 MB",
        date: "02.03.2021"
    },
    {
        id: "4",
        name: "ebods.convm.set",
        type: "doc",
        size: "3.4 MB",
        date: "02.03.2021"
    },
    { id: "5", name: "Dropped folder", type: "file", size: "—", date: "" }
];

export const useLibraryStore = create<LibState>(set => ({
    tab: "images",
    viewMode: "grid",
    search: "",
    files: MOCK_FILES,
    selected: new Set(),
    setTab: tab => set({ tab }),
    setViewMode: viewMode => set({ viewMode }),
    setSearch: search => set({ search }),
    toggleSelect: id =>
        set(s => {
            const next = new Set(s.selected);
            next.has(id) ? next.delete(id) : next.add(id);
            return { selected: next };
        }),
    clearSelect: () => set({ selected: new Set() })
}));

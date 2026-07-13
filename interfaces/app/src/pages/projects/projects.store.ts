import { create } from "zustand";

export interface Project {
    id: string;
    name: string;
    model: string;
    cascade: boolean;
    profile: string;
    lastActive: string;
    messageCount: number;
    collaborators?: string[];
    description?: string;
}

interface ProjectsState {
    projects: Project[];
    selected: string | null;
    setSelected: (id: string | null) => void;
    addProject: (p: Omit<Project, "id">) => void;
    deleteProject: (id: string) => void;
}

const MOCK: Project[] = [
    {
        id: "1",
        name: "4le816a",
        model: "claude-sonnet-4-6",
        cascade: true,
        profile: "balanced",
        lastActive: "Last alive ago",
        messageCount: 12,
        description:
            "Documentaomt descriptionom of the project omeconversation, descriptionomer, listdescrip ftoober.",
        collaborators: ["gpilosa", "go+model"]
    },
    {
        id: "2",
        name: "4le816a",
        model: "claude-sonnet-4-6",
        cascade: false,
        profile: "quality",
        lastActive: "Last alive ago",
        messageCount: 8,
        description:
            "Conversaion description with project name model selected.",
        collaborators: []
    },
    {
        id: "3",
        name: "4le816te",
        model: "gpt-4o",
        cascade: true,
        profile: "speed",
        lastActive: "Last alive ago",
        messageCount: 3,
        description:
            "Decormentert project descirption reponsibili resourcmess.",
        collaborators: ["Titeans"]
    },
    {
        id: "4",
        name: "4le816te",
        model: "gpt-4o",
        cascade: false,
        profile: "cheap",
        lastActive: "Last alive ago",
        messageCount: 24
    }
];

export const useProjectsStore = create<ProjectsState>(set => ({
    projects: MOCK,
    selected: null,
    setSelected: selected => set({ selected }),
    addProject: p =>
        set(s => ({
            projects: [...s.projects, { ...p, id: Date.now().toString() }]
        })),
    deleteProject: id =>
        set(s => ({
            projects: s.projects.filter(p => p.id !== id),
            selected: null
        }))
}));

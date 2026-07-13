export interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    model?: string;
    tokens?: number;
    costUsd?: number;
    createdAt: number;
    files?: AttachedFile[];
}

export interface AttachedFile {
    name: string;
    size: number;
    type: string;
    url?: string;
}

export interface CascadeEvent {
    from: string;
    to: string;
    reason: string;
    at: number;
}

export interface Session {
    id: string;
    title: string;
    model: string;
    createdAt: number;
    messageCount: number;
}

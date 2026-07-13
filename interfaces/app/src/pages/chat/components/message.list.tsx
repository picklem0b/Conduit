import { useRef, useEffect } from "react";
import { C } from "@/lib/tokens";
import { MessageBubble } from "./message.bubble";
import { CascadeEventChip } from "./cascade.event";
import type { Message, CascadeEvent } from "../chat.types";

interface MessageListProps {
    messages: Message[];
    cascadeEvents: CascadeEvent[];
    streamContent: string;
    streamModel: string;
    isStreaming: boolean;
}

export function MessageList({
    messages,
    cascadeEvents,
    streamContent,
    streamModel,
    isStreaming
}: MessageListProps) {
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length, streamContent]);

    return (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    maxWidth: 760,
                    margin: "0 auto"
                }}
            >
                {messages.map((msg, i) => {
                    const cascadesHere = cascadeEvents.filter(
                        (c, ci) => ci === i
                    );
                    return (
                        <div key={msg.id}>
                            {cascadesHere.map((c, ci) => (
                                <CascadeEventChip key={ci} {...c} />
                            ))}
                            <MessageBubble message={msg} />
                        </div>
                    );
                })}

                {isStreaming && streamContent && (
                    <MessageBubble
                        message={{
                            id: "__stream__",
                            role: "assistant",
                            content: streamContent,
                            model: streamModel,
                            createdAt: Date.now()
                        }}
                        streaming
                    />
                )}

                <div ref={endRef} />
            </div>
        </div>
    );
}

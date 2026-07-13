import { useState, useEffect } from "react";
import { getProviders, getModels } from "@/lib/api.lib";

export interface ProviderInfo {
    id: string;
    configured: boolean;
    healthy: boolean;
    latencyMs?: number;
}

export interface ModelInfo {
    id: string;
    name?: string;
    contextWindow?: number;
}

export function useProviders() {
    const [providers, setProviders] = useState<ProviderInfo[]>([]);
    const [chatModels, setChatModels] = useState<ModelInfo[]>([]);
    const [imageModels, setImageModels] = useState<ModelInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const [p, m] = await Promise.all([getProviders(), getModels()]);
            setProviders(p.providers);
            setChatModels(m.chat);
            setImageModels(m.image);
        } catch (e) {
            setError(String(e));
        }
        setLoading(false);
    };

    useEffect(() => {
        refresh();
    }, []);

    const healthyModels = chatModels.filter(m => {
        const provider = m.id.split("-")[0];
        return providers.find(p => p.id === provider)?.healthy !== false;
    });

    return {
        providers,
        chatModels,
        imageModels,
        healthyModels,
        loading,
        error,
        refresh
    };
}

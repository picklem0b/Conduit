export interface GatewayStatus {
    alive: boolean;
    version?: string;
}

export async function probeGateway(): Promise<GatewayStatus> {
    try {
        const r = await fetch("/api/health", {
            signal: AbortSignal.timeout(3000)
        });
        if (!r.ok) return { alive: false };
        const data = (await r.json()) as { status?: string; version?: string };
        return { alive: data.status === "ok", version: data.version };
    } catch {
        return { alive: false };
    }
}

const BASE = "/api";

export async function api<T>(path: string, opts?: RequestInit): Promise<T> {
    const r = await fetch(`${BASE}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...opts
    });
    if (!r.ok) {
        const body = await r.text();
        throw new Error(`${r.status} ${r.statusText}: ${body}`);
    }
    return r.json() as Promise<T>;
}

export async function streamSSE(
    path: string,
    body: unknown,
    signal: AbortSignal,
    onEvent: (evt: { type: string; [key: string]: unknown }) => void
): Promise<void> {
    const resp = await fetch(`${BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal
    });

    if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`${resp.status}: ${t}`);
    }

    const reader = resp.body!.getReader();
    const dec = new TextDecoder();
    let buf = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
            if (line.startsWith("data: ")) {
                try {
                    onEvent(JSON.parse(line.slice(6)));
                } catch {
                    /* ignore */
                }
            }
        }
    }
}

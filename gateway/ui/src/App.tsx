import { useState } from "react";
import { C } from "./lib/tokens";
import { StatusTab } from "./tabs/status.tab";
import { ChatTab } from "./tabs/chat.tab";
import { KeysTab } from "./tabs/keys.tab";
import { ProvidersTab } from "./tabs/providers.tab";
import { DiscoveryTab, MediaTab, SearchTab, CodeTab } from "./tabs/misc.tabs";
import type { Tab } from "./types/api.types";

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; short: string; route: string }[] = [
    {
        id: "status",
        label: "Status",
        short: "Status",
        route: "/api/health · /api/status"
    },
    { id: "chat", label: "Chat", short: "Chat", route: "/api/chat/stream" },
    { id: "keys", label: "Keys", short: "Keys", route: "/api/keys" },
    {
        id: "providers",
        label: "Providers",
        short: "Provs",
        route: "/api/providers/health · /api/models"
    },
    {
        id: "discovery",
        label: "Discovery",
        short: "Disc",
        route: "/api/discovery/probe"
    },
    {
        id: "media",
        label: "Media",
        short: "Media",
        route: "/api/media/generate"
    },
    {
        id: "search",
        label: "Search",
        short: "Search",
        route: "/api/search/query"
    },
    { id: "code", label: "Code", short: "Code", route: "/api/code/execute" }
];

// ── Tab content ───────────────────────────────────────────────────────────────
function TabContent({ tab }: { tab: Tab }) {
    switch (tab) {
        case "status":
            return <StatusTab />;
        case "chat":
            return <ChatTab />;
        case "keys":
            return <KeysTab />;
        case "providers":
            return <ProvidersTab />;
        case "discovery":
            return <DiscoveryTab />;
        case "media":
            return <MediaTab />;
        case "search":
            return <SearchTab />;
        case "code":
            return <CodeTab />;
    }
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
    const [tab, setTab] = useState<Tab>("status");
    const active = TABS.find(t => t.id === tab)!;

    return (
        <>
            {/* Responsive styles */}
            <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, -apple-system, sans-serif; background: ${C.bg}; color: ${C.text}; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
        input::placeholder, textarea::placeholder { color: ${C.muted}; }
        select option { background: ${C.surface}; }

        /* Desktop: top nav. Mobile: bottom nav */
        .top-nav { display: flex; }
        .bottom-nav { display: none; }
        .content-area { padding: 24px; padding-bottom: 24px; }

        @media (max-width: 640px) {
          .top-nav { display: none; }
          .bottom-nav { display: flex; }
          .content-area { padding: 16px; padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px) + 16px); }
        }
      `}</style>

            <div
                style={{
                    minHeight: "100dvh",
                    background: C.bg,
                    display: "flex",
                    flexDirection: "column"
                }}
            >
                {/* ── Desktop top nav ── */}
                <div
                    className="top-nav"
                    style={{
                        borderBottom: `1px solid ${C.border}`,
                        padding: "0 20px",
                        alignItems: "center",
                        height: 52,
                        gap: 4,
                        position: "sticky",
                        top: 0,
                        background: C.bg,
                        zIndex: 20,
                        overflowX: "auto"
                    }}
                >
                    <div
                        style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: C.text,
                            letterSpacing: "-0.3px",
                            marginRight: 12,
                            flexShrink: 0
                        }}
                    >
                        Conduit
                    </div>
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: 13,
                                fontWeight: tab === t.id ? 600 : 400,
                                color: tab === t.id ? C.text : C.dim,
                                padding: "0 8px",
                                borderBottom:
                                    tab === t.id
                                        ? `2px solid ${C.blue}`
                                        : "2px solid transparent",
                                height: 52,
                                transition: "color 0.1s",
                                flexShrink: 0,
                                WebkitTapHighlightColor: "transparent"
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ── Route breadcrumb (desktop only) ── */}
                <div
                    className="top-nav"
                    style={{
                        padding: "8px 20px",
                        borderBottom: `1px solid ${C.border}`,
                        background: C.surface
                    }}
                >
                    <span
                        style={{
                            fontSize: 11,
                            fontFamily: "monospace",
                            color: C.dim
                        }}
                    >
                        {active.route}
                    </span>
                </div>

                {/* ── Content ── */}
                <div
                    className="content-area"
                    style={{
                        flex: 1,
                        maxWidth: 860,
                        width: "100%",
                        margin: "0 auto"
                    }}
                >
                    <TabContent tab={tab} />
                </div>

                {/* ── Mobile bottom nav ── */}
                <div
                    className="bottom-nav"
                    style={{
                        position: "fixed",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        borderTop: `1px solid ${C.border}`,
                        background: C.bg,
                        zIndex: 20,
                        paddingBottom: "env(safe-area-inset-bottom, 0px)",
                        overflowX: "auto"
                    }}
                >
                    <div style={{ display: "flex", height: 56 }}>
                        {TABS.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                style={{
                                    flex: 1,
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: 10,
                                    fontWeight: tab === t.id ? 600 : 400,
                                    color: tab === t.id ? C.blue : C.dim,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 2,
                                    borderTop:
                                        tab === t.id
                                            ? `2px solid ${C.blue}`
                                            : "2px solid transparent",
                                    padding: "0 4px",
                                    minWidth: 0,
                                    WebkitTapHighlightColor: "transparent"
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 9,
                                        letterSpacing: "0.02em"
                                    }}
                                >
                                    {t.short}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

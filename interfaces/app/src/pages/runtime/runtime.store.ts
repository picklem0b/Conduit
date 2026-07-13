import { create } from "zustand";

interface RuntimeState {
  autoRefresh: boolean;
  refreshInterval: number;
  setAutoRefresh: (v: boolean) => void;
  setRefreshInterval: (ms: number) => void;
}

export const useRuntimeStore = create<RuntimeState>((set) => ({
  autoRefresh: true,
  refreshInterval: 15000,
  setAutoRefresh: (autoRefresh) => set({ autoRefresh }),
  setRefreshInterval: (refreshInterval) => set({ refreshInterval }),
}));
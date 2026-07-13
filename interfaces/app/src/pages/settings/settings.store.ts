import { create } from "zustand";

type SettingsSection = "General" | "Appearance" | "Providers & Keys" | "Cascade" | "Models" | "Storage" | "Shortcuts" | "About";

interface SettingsState {
  section: SettingsSection;
  setSection: (s: SettingsSection) => void;
  theme: "dark";
  accent: string;
  setAccent: (a: string) => void;
  persona: string;
  setPersona: (p: string) => void;
  cascadeEnabled: boolean;
  setCascadeEnabled: (v: boolean) => void;
  cascadeProfile: string;
  setCascadeProfile: (p: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  section: "Providers & Keys",
  setSection: (section) => set({ section }),
  theme: "dark",
  accent: "#3b82f6",
  setAccent: (accent) => set({ accent }),
  persona: "You are a helpful assistant.",
  setPersona: (persona) => set({ persona }),
  cascadeEnabled: true,
  setCascadeEnabled: (cascadeEnabled) => set({ cascadeEnabled }),
  cascadeProfile: "balanced",
  setCascadeProfile: (cascadeProfile) => set({ cascadeProfile }),
}));
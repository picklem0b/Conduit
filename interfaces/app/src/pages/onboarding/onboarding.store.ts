import { create } from "zustand";

export type OnboardingStep =
    | "welcome"
    | "keys"
    | "cascade"
    | "persona"
    | "appearance";
const STEPS: OnboardingStep[] = [
    "welcome",
    "keys",
    "cascade",
    "persona",
    "appearance"
];

interface OnboardingState {
    step: OnboardingStep;
    completed: Set<OnboardingStep>;
    persona: string;
    accent: string;
    done: boolean;
    next: () => void;
    back: () => void;
    setPersona: (p: string) => void;
    setAccent: (a: string) => void;
    finish: () => void;
    skip: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
    step: "welcome",
    completed: new Set(),
    persona: "",
    accent: C_BLUE,
    done: false,
    next: () => {
        const idx = STEPS.indexOf(get().step);
        if (idx < STEPS.length - 1) {
            const next = STEPS[idx + 1];
            set(s => ({
                step: next,
                completed: new Set([...s.completed, s.step])
            }));
        } else {
            get().finish();
        }
    },
    back: () => {
        const idx = STEPS.indexOf(get().step);
        if (idx > 0) set({ step: STEPS[idx - 1] });
    },
    setPersona: persona => set({ persona }),
    setAccent: accent => set({ accent }),
    finish: () => {
        localStorage.setItem("conduit_onboarded", "1");
        set({ done: true });
    },
    skip: () => {
        localStorage.setItem("conduit_onboarded", "1");
        set({ done: true });
    }
}));

const C_BLUE = "#3b82f6";

export function needsOnboarding(): boolean {
    return !localStorage.getItem("conduit_onboarded");
}

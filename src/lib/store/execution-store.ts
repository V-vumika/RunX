import { create } from "zustand";

import type { RunResult, Snapshot } from "@/types/snapshot";
import {
  getPyodideClient,
  type EngineStatus,
} from "@/lib/execution/pyodide-client";

/** Starter program: a loop accumulator + recursion, to exercise the visualizer. */
export const DEFAULT_CODE = `def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)


numbers = [5, 2, 9, 1, 7]
total = 0
for x in numbers:
    total += x

result = factorial(4)

print("sum:", total)
print("4! =", result)
`;

interface ExecutionState {
  code: string;
  snapshots: Snapshot[];
  currentStep: number;
  isRunning: boolean;
  result: RunResult | null;
  runError: string | null;

  engineStatus: EngineStatus;
  engineError?: string;
  engineSubscribed: boolean;

  /** Auto-play state */
  isPlaying: boolean;
  playSpeed: number; // steps per second: 0.5 | 1 | 2 | 4
  _playTimer: ReturnType<typeof setInterval> | null;

  setCode: (code: string) => void;
  initEngine: () => void;
  run: () => Promise<void>;
  stepForward: () => void;
  stepBackward: () => void;
  goToStep: (step: number) => void;
  reset: () => void;

  /** Auto-play controls */
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setPlaySpeed: (speed: number) => void;
}

export const useExecutionStore = create<ExecutionState>((set, get) => ({
  code: DEFAULT_CODE,
  snapshots: [],
  currentStep: 0,
  isRunning: false,
  result: null,
  runError: null,

  engineStatus: "uninitialized",
  engineError: undefined,
  engineSubscribed: false,

  isPlaying: false,
  playSpeed: 1,
  _playTimer: null,

  // If a trace already exists, an edit means the displayed line/variables no
  // longer match the code on screen — clear it rather than show stale state.
  setCode: (code) =>
    set((state) =>
      state.snapshots.length > 0
        ? { code, snapshots: [], currentStep: 0, result: null, runError: null }
        : { code }
    ),

  initEngine: () => {
    if (get().engineSubscribed || typeof window === "undefined") return;
    set({ engineSubscribed: true });
    const client = getPyodideClient();
    client.subscribe((status, error) =>
      set({ engineStatus: status, engineError: error })
    );
    client.init();
  },

  run: async () => {
    if (get().isRunning) return;
    // stop auto-play if running new code
    get().pause();
    set({ isRunning: true, runError: null });
    try {
      const result = await getPyodideClient().run(get().code);
      set({
        snapshots: result.snapshots,
        result,
        currentStep: 0,
        isRunning: false,
      });
    } catch (err) {
      set({
        isRunning: false,
        runError: err instanceof Error ? err.message : String(err),
        snapshots: [],
        result: null,
        currentStep: 0,
      });
    }
  },

  stepForward: () => {
    const { currentStep, snapshots } = get();
    if (snapshots.length === 0) return;
    const next = Math.min(currentStep + 1, snapshots.length - 1);
    set({ currentStep: next });
    // stop at end
    if (next >= snapshots.length - 1) get().pause();
  },

  stepBackward: () => {
    const { currentStep } = get();
    set({ currentStep: Math.max(currentStep - 1, 0) });
  },

  goToStep: (step) => {
    const { snapshots } = get();
    if (snapshots.length === 0) return;
    set({ currentStep: Math.max(0, Math.min(step, snapshots.length - 1)) });
  },

  reset: () => {
    get().pause();
    set({ snapshots: [], currentStep: 0, result: null, runError: null });
  },

  play: () => {
    const { isPlaying, playSpeed, _playTimer } = get();
    if (isPlaying) return;
    if (_playTimer) clearInterval(_playTimer);
    const interval = Math.round(1000 / playSpeed);
    const timer = setInterval(() => {
      get().stepForward(); // stepForward calls pause() at end automatically
    }, interval);
    set({ isPlaying: true, _playTimer: timer });
  },

  pause: () => {
    const { _playTimer } = get();
    if (_playTimer) clearInterval(_playTimer);
    set({ isPlaying: false, _playTimer: null });
  },

  togglePlay: () => {
    const { isPlaying } = get();
    if (isPlaying) get().pause();
    else get().play();
  },

  setPlaySpeed: (speed) => {
    const { isPlaying } = get();
    set({ playSpeed: speed });
    // restart timer with new speed if currently playing
    if (isPlaying) {
      get().pause();
      get().play();
    }
  },
}));

export function selectCurrentSnapshot(state: ExecutionState): Snapshot | null {
  return state.snapshots[state.currentStep] ?? null;
}

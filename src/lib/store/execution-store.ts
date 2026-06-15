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
  /** Current editor contents. */
  code: string;
  /** Captured execution trace from the most recent run. */
  snapshots: Snapshot[];
  /** Index of the snapshot currently being inspected. */
  currentStep: number;
  /** True while a run is in flight. */
  isRunning: boolean;
  /** Full result metadata (stdout, error, truncated, timing). */
  result: RunResult | null;
  /** Worker/engine-level failure (distinct from a Python error in `result`). */
  runError: string | null;

  /** Status of the Pyodide runtime itself. */
  engineStatus: EngineStatus;
  engineError?: string;
  engineSubscribed: boolean;

  setCode: (code: string) => void;
  /** Wire the store up to the execution engine and start loading Pyodide. */
  initEngine: () => void;
  /** Execute the current code and load its snapshots. */
  run: () => Promise<void>;
  stepForward: () => void;
  stepBackward: () => void;
  goToStep: (step: number) => void;
  /** Clear the current trace (keeps the code). */
  reset: () => void;
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

  setCode: (code) => set({ code }),

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
    set({ currentStep: Math.min(currentStep + 1, snapshots.length - 1) });
  },

  stepBackward: () => {
    const { currentStep } = get();
    set({ currentStep: Math.max(currentStep - 1, 0) });
  },

  goToStep: (step) => {
    const { snapshots } = get();
    if (snapshots.length === 0) return;
    const clamped = Math.max(0, Math.min(step, snapshots.length - 1));
    set({ currentStep: clamped });
  },

  reset: () =>
    set({ snapshots: [], currentStep: 0, result: null, runError: null }),
}));

/** Selector: the snapshot currently being inspected, or null. */
export function selectCurrentSnapshot(state: ExecutionState): Snapshot | null {
  return state.snapshots[state.currentStep] ?? null;
}

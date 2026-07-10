import { create } from "zustand";

import type { RunResult, Snapshot } from "@/types/snapshot";
import {
  getExecutionClient,
  type EngineStatus,
} from "@/lib/execution/providers";
import {
  getEntryRunner,
  type EntryPoint,
  type Inputs,
  type Language,
} from "@/lib/execution/entry";
import { preflightCheck, type SupportIssue } from "@/lib/execution/support-check";
import { stepBudget } from "@/lib/execution/step-budget";

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

/** JS starter — mirrors the Python default so the two feel like one product. */
export const DEFAULT_JS_CODE = `function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

const numbers = [5, 2, 9, 1, 7];
let total = 0;
for (const x of numbers) total += x;

console.log("sum:", total);
console.log("4! =", factorial(4));
`;

const DEFAULT_CODE_BY_LANGUAGE: Partial<Record<Language, string>> = {
  python: DEFAULT_CODE,
  javascript: DEFAULT_JS_CODE,
};

/** Detected entry point + free-form driver for the current code. */
const NO_ENTRY: EntryPoint = { kind: "has-driver", params: [] };

/** Whether an entry kind needs a synthesized driver to actually run. */
function needsDriver(entry: EntryPoint): boolean {
  return entry.kind === "class-method" || entry.kind === "free-function";
}

/**
 * Re-detect the entry point for `code`, carrying over any input values whose
 * parameter names still exist. Falls back to a no-op entry for languages
 * without a runner yet.
 */
function deriveEntry(
  language: Language,
  code: string,
  currentInputs: Inputs
): { entry: EntryPoint; inputs: Inputs } {
  const runner = getEntryRunner(language);
  if (!runner) return { entry: NO_ENTRY, inputs: {} };

  const entry = runner.detectEntry(code);
  // Keep values for params that survived the edit; drop the rest.
  const inputs: Inputs = {};
  for (const p of entry.params) {
    if (currentInputs[p] !== undefined) inputs[p] = currentInputs[p];
  }
  return { entry, inputs };
}

interface ExecutionState {
  code: string;
  language: Language;
  /** Callable entry point detected in the current code (LeetCode-style paste). */
  entry: EntryPoint;
  /** Input values per parameter name; we build the call, the user fills these. */
  inputs: Inputs;
  /** Text fed to stdin for input()-based programs. */
  stdin: string;
  snapshots: Snapshot[];
  currentStep: number;
  isRunning: boolean;
  result: RunResult | null;
  runError: string | null;
  /** Non-blocking support warnings (network/files/threads/async) for the last run. */
  supportWarnings: SupportIssue[];

  engineStatus: EngineStatus;
  engineError?: string;
  /** Unsubscribe from the current language's engine-status stream (internal). */
  _engineUnsub: (() => void) | null;
  /** Per-language code buffers so switching languages doesn't lose work (internal). */
  _codeByLang: Partial<Record<Language, string>>;

  /** Auto-play state */
  isPlaying: boolean;
  playSpeed: number; // steps per second: 0.5 | 1 | 2 | 4
  _playTimer: ReturnType<typeof setInterval> | null;

  setCode: (code: string) => void;
  setLanguage: (language: Language) => void;
  setInput: (name: string, value: string) => void;
  setStdin: (stdin: string) => void;
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
  language: "python",
  // DEFAULT_CODE has top-level driver code, so this resolves to has-driver.
  ...deriveEntry("python", DEFAULT_CODE, {}),
  stdin: "",
  snapshots: [],
  currentStep: 0,
  isRunning: false,
  result: null,
  runError: null,
  supportWarnings: [],

  engineStatus: "uninitialized",
  engineError: undefined,
  _engineUnsub: null,
  _codeByLang: {},

  isPlaying: false,
  playSpeed: 1,
  _playTimer: null,

  // If a trace already exists, an edit means the displayed line/variables no
  // longer match the code on screen — clear it rather than show stale state.
  setCode: (code) =>
    set((state) => {
      const derived = deriveEntry(state.language, code, state.inputs);
      const cleared =
        state.snapshots.length > 0
          ? { snapshots: [], currentStep: 0, result: null, runError: null, supportWarnings: [] }
          : {};
      return {
        code,
        ...derived,
        ...cleared,
        _codeByLang: { ...state._codeByLang, [state.language]: code },
      };
    }),

  // Switching languages swaps the whole working context: the code buffer
  // (per-language, so nothing is lost), the detected entry, the trace, and the
  // engine-status subscription — the engines themselves stay alive, so
  // switching back is instant.
  setLanguage: (language) => {
    const state = get();
    if (language === state.language) return;
    state.pause();
    const cache = { ...state._codeByLang, [state.language]: state.code };
    const code = cache[language] ?? DEFAULT_CODE_BY_LANGUAGE[language] ?? "";
    const derived = deriveEntry(language, code, {});
    set({
      language,
      code,
      ...derived,
      _codeByLang: cache,
      snapshots: [],
      currentStep: 0,
      result: null,
      runError: null,
      supportWarnings: [],
    });
    get().initEngine();
  },

  setInput: (name, value) =>
    set((state) => ({ inputs: { ...state.inputs, [name]: value } })),

  setStdin: (stdin) => set({ stdin }),

  // (Re)points the status subscription at the current language's engine and
  // starts loading it. Called on mount and after every language switch.
  initEngine: () => {
    if (typeof window === "undefined") return;
    const client = getExecutionClient(get().language);
    if (!client) return; // language without an engine yet (selector disables these)
    get()._engineUnsub?.();
    const unsub = client.subscribe((status, error) =>
      set({ engineStatus: status, engineError: error })
    );
    set({ _engineUnsub: unsub });
    client.init();
  },

  run: async () => {
    if (get().isRunning) return;
    // stop auto-play if running new code
    get().pause();

    const { code, language, entry, inputs } = get();

    const client = getExecutionClient(language);
    if (!client) {
      set({ runError: `${language} execution isn't available yet.` });
      return;
    }

    // Pre-flight: some code can't run in the sandbox. Block the hang cases,
    // keep the rest as warnings shown alongside the trace.
    const issues = preflightCheck(code, language);
    const blocking = issues.find((i) => i.severity === "block");
    const warnings = issues.filter((i) => i.severity === "warn");
    if (blocking) {
      set({
        runError: `${blocking.title} — ${blocking.detail}`,
        supportWarnings: [],
        snapshots: [],
        result: null,
        currentStep: 0,
      });
      return;
    }

    // For a bare solution (no top-level driver), we synthesize a call to the
    // entry point so it actually executes and gets traced.
    const runner = getEntryRunner(language);
    const usesDriver = runner !== undefined && needsDriver(entry);

    if (usesDriver) {
      // Every parameter needs a value, else the synthesized call is a confusing
      // SyntaxError / NameError. Catch it early with a clear message.
      const missing = entry.params.filter((p) => !(inputs[p] ?? "").trim());
      if (missing.length > 0) {
        set({
          runError: `Fill in ${missing.join(", ")} in the Inputs panel before running.`,
        });
        return;
      }
    }

    set({ isRunning: true, runError: null, supportWarnings: warnings });
    try {
      const source = usesDriver
        ? runner!.buildSource(code, entry, inputs)
        : code;
      // Nested structures (linked lists, tries, trees) live several attribute
      // hops deep — the default depth of 5 truncates them mid-chain. 12 lets a
      // typical demo list/trie serialize fully; breadth is still capped by
      // maxItems. (The JS engine ignores the trace-shaping options it doesn't
      // use — only stdin matters to it today.)
      const result = await client.run(source, {
        maxDepth: 12,
        maxSteps: stepBudget(source),
        stdin: get().stdin,
      });
      set({
        snapshots: result.snapshots,
        result,
        currentStep: 0,
        isRunning: false,
      });
      // Play the trace step-by-step at the chosen speed instead of jumping to
      // the final state — watching it run line by line is the whole point.
      if (result.snapshots.length > 1) get().play();
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
    set({ snapshots: [], currentStep: 0, result: null, runError: null, supportWarnings: [] });
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

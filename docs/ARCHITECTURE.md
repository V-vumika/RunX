# RunX — Architecture

How the pieces fit. Read this before touching the engine or adding a visualizer.

## Data flow

```
Monaco editor
  → Pyodide worker (sys.settrace)
  → snapshots[] (one per executed line)
  → Zustand store (holds snapshots + currentStep)
  → panels / visualizers read the CURRENT snapshot
```

## The contract — `src/types/snapshot.ts` (most important file)

Everything the UI shows comes from here. The worker **produces** it, the UI
**consumes** it. Never change the shape on one side without the other.

- `RunResult` — `{ snapshots, stdout, error, truncated, durationMs }`
- `Snapshot` — `{ step, line, event, stack[], stdout, returnValue? }`. Represents
  the program state **before** that line runs.
- `StackFrame` — `{ functionName, line, locals: Variable[] }`. Order: outermost
  (`<module>`) first, innermost (current) last.
- `Variable` — `{ name, value: ValueNode }`
- `ValueNode` — a recursively serialized Python value. This is what visualizers
  render. Fields: `kind` (int/float/str/bool/none/list/tuple/set/dict/object/
  function/module/circular/truncated/other), `repr`, `id` (object identity — use
  for aliasing/shared-reference detection), `value` (primitives), `items`
  (list/tuple/set), `entries` (dict), `attributes` (object), `length`, `truncated`.

## Execution providers — `src/lib/execution/providers.ts`

One engine per language, one interface. `getExecutionClient(language)` returns an
`ExecutionClient` (status subscription + watchdog-guarded `run()`); the store
never touches a concrete client.

- `python` → Pyodide worker client (below) — full per-line tracing.
- `javascript` → `js-client.ts` + `public/workers/js.worker.js` — executes via
  `AsyncFunction` inside a plain worker (never main-thread eval). Source is
  instrumented on the main thread first (`src/lib/execution/js-tracer/instrument.ts`,
  acorn + astring), so the worker emits a full per-line `Snapshot[]` — line,
  call, and return events with captured return values — same as Python.
  Explain and all visualizers work for JS. Complexity also works for JS:
  `src/lib/explain/lang/` (per-language profiles) statically analyzes the
  source and the store fills `result.complexity` from it.
- `java` / `cpp` → future Judge0 CE client registers here; no store/UI change.

## Complexity analysis — `src/lib/explain/lang/`

`ComplexityInfo` facts (scaling-loop nesting + recursion shape) decide the
Big-O class, always by rules (project rule — never the LLM). Two sources:

- **Python** — the tracer's AST pass (`__runx_analyze_complexity` in the
  worker) attaches the facts to `RunResult.complexity`.
- **Tracerless languages (JS today)** — a `LanguageProfile` in
  `src/lib/explain/lang/` provides `analyzeComplexity(code)` (a rules-based
  lexical scanner) plus the source signals `classify.ts` needs
  (`definedFunctions`, `usesHeap`, `halvesRange`, `fallbackLoopNesting`,
  `scriptTitle`). The store fills `result.complexity` from
  `staticComplexity(language, source)` when the worker didn't emit it;
  `ComplexityPanel` gates on `hasComplexityAnalysis(language)`.

Adding a language to the Complexity tab = one new profile file registered in
`lang/index.ts` — classifier, store, and panel stay untouched.

## The engine — `public/workers/pyodide.worker.js`

- Classic Web Worker; loads Pyodide from CDN (`PYODIDE_VERSION` const).
- Embedded Python `__runx_run()` uses `sys.settrace` to record **only** the
  user's lines (filename `"<runx>"`), serializes locals + call stack to JSON each
  step, captures stdout per step.
- Infinite-loop guard: step limit → raises `_StepLimit` to stop cleanly
  (`truncated: true`). Catches syntax errors (compile) and runtime errors.
- Messages out: `status` / `ready` / `init-error` / `result` / `run-error`.

## The client — `src/lib/execution/pyodide-client.ts`

Singleton. Owns the worker, tracks engine status, `run(code) → Promise<RunResult>`.

## The store — `src/lib/store/execution-store.ts`

State: `code, language, snapshots, currentStep, isRunning, result, engineStatus,
stdin, inputs, entry, isPlaying, playSpeed` (+ per-language code buffers, so
switching languages never loses work).
Actions: `setCode, setLanguage, initEngine, run, stepForward, stepBackward,
goToStep, reset, setInput, setStdin, togglePlay, setPlaySpeed, pause`.
Selector: `selectCurrentSnapshot(state)`. `initEngine`/`run` resolve the
engine through `getExecutionClient(language)`.

## Adding a visualizer (the common future task)

1. New component in `src/components/visualizers/`.
2. Read the current snapshot: `useExecutionStore(selectCurrentSnapshot)`.
3. Pull the variable(s) you need from `frame.locals`, render the `ValueNode`
   (reuse `src/components/inspector/ValueView.tsx` patterns).
4. Animate changes between steps with Framer Motion if needed.

> No engine change needed — the data is already in the snapshot. Most phases are
> just new views over existing data.

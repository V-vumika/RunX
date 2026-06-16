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

State: `code, snapshots, currentStep, isRunning, result, engineStatus`.
Actions: `setCode, initEngine, run, stepForward, stepBackward, goToStep, reset`.
Selector: `selectCurrentSnapshot(state)`.

## Adding a visualizer (the common future task)

1. New component in `src/components/visualizers/`.
2. Read the current snapshot: `useExecutionStore(selectCurrentSnapshot)`.
3. Pull the variable(s) you need from `frame.locals`, render the `ValueNode`
   (reuse `src/components/inspector/ValueView.tsx` patterns).
4. Animate changes between steps with Framer Motion if needed.

> No engine change needed — the data is already in the snapshot. Most phases are
> just new views over existing data.

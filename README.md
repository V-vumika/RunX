# RunX

An AI-powered code execution, DSA, and complexity visualizer for students.

RunX lets you **run code step-by-step**, **visualize data structures and
algorithms** in real time, and (later) **analyze time/space complexity** with an
AI explanation layer. The goal is to replace the opaque "Code → Output" mental
model with visibility into execution, memory, variables, the call stack, and
data-structure changes.

## Status — Phase 1 (MVP)

The end-to-end execution pipeline is working:

**Editor → Execution Engine → Snapshots → State Store → Inspector**

- ✅ Monaco editor with Python input
- ✅ Pyodide runtime in a Web Worker, tracing every line via `sys.settrace()`
- ✅ Per-line snapshots (line, call stack, locals, stdout) serialized to JSON
- ✅ Zustand store with run / step-forward / step-back / jump-to-step controls
- ✅ Variable Inspector, Call Stack, and Output panels
- ✅ Current-line highlighting + time-travel slider

## Tech stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Editor:** Monaco (`@monaco-editor/react`)
- **State:** Zustand
- **Python execution:** Pyodide (loaded from CDN, run in a classic Web Worker)
- **JavaScript execution:** a dedicated classic Web Worker (`AsyncFunction`,
  console/stdin/error capture — output-only for now, per-line tracing later)
- Later: Framer Motion (animation), React Flow + D3 (graphs/trees), Supabase
  (db/auth), OpenAI/Gemini (AI layer)

## Architecture

```
Monaco Editor                         src/components/editor
   ↓
Execution Engine (Pyodide + settrace) public/workers/pyodide.worker.js
   ↓                                  src/lib/execution/pyodide-client.ts
Snapshot Generator                    (line, variables, call stack per step)
   ↓
State Store (Zustand)                 src/lib/store/execution-store.ts
   ↓
Visualizer Engine                     src/components/visualizers (Phase 3+)
   ↓
AI Analysis Layer                     src/lib/ai (Phase 7+)
   ↓
UI Components                         src/components
```

The contract between the worker and the UI lives in `src/types/snapshot.ts`
(`Snapshot`, `StackFrame`, `Variable`, `ValueNode`, `RunResult`). The same
`ValueNode` tree feeds the variable inspector today and the DSA visualizers
later.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000, edit the Python in the left pane, hit **Run**, then
step through execution with the controls (or the ← / → arrow keys) and watch the
variables, call stack, and output update at each step.

> The first run downloads the Pyodide runtime (~several MB) from the jsDelivr
> CDN, so it needs network access and takes a moment on first load.

## Project structure

```
public/workers/        Execution workers (Pyodide for Python, plain worker for JS)
src/app/               Next.js App Router entry + global styles
src/components/
  editor/              Monaco code editor + language selector
  execution/           Run/step controls, call stack, output
  inspector/           Variable inspector + recursive value renderer
  visualizers/         DSA visualizers (Phase 3+)
  ui/                  shadcn/ui primitives
src/lib/
  execution/           Typed worker clients + per-language provider registry
  store/               Zustand execution store
  ai/                  AI provider interface (Phase 7+)
  supabase/            DB/auth client (later)
src/types/             Shared snapshot/value types
```

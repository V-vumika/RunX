![Build](https://img.shields.io/github/actions/workflow/status/V-vumika/RunX/build.yml?branch=main) ![License](https://img.shields.io/badge/license-MIT-blue)

# RunX

An AI-powered code execution, DSA, and complexity visualizer for students.

RunX lets you **run code step-by-step**, **visualize data structures and
algorithms** in real time, and **analyze time/space complexity** with a
rules-based detector (no LLM — the class is always computed, never guessed).
The goal is to replace the opaque "Code → Output" mental model with
visibility into execution, memory, variables, the call stack, and
data-structure changes.

## Status — v1.0

Python and JavaScript are full, equal citizens end to end:

- ✅ Monaco editor, Python + JavaScript
- ✅ Per-line execution tracing for both languages (Pyodide `sys.settrace`
  for Python; AST instrumentation via acorn/astring for JavaScript), into a
  shared `Snapshot`/`ValueNode` contract
- ✅ 11 algorithm/DSA visualizers, auto-selected from the trace
- ✅ Rules-based time/space complexity analysis (no LLM — the class is
  always computed, never guessed)
- ✅ LeetCode-paste support: a bare function/class is detected and given an
  inputs panel so it runs
- ✅ Interview mode — practice DSA problems with a target complexity, both
  languages
- ✅ Marketing landing page at `/`; the workspace lives at `/app`

## Tech stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui (Radix)
- **Editor:** Monaco (`@monaco-editor/react`)
- **State:** Zustand
- **Animation:** Framer Motion
- **Graphs/trees:** plain SVG visualizers (`TreeViz`, `GraphViz`)
- **Python execution:** Pyodide (loaded from CDN, runs in a classic Web Worker)
- **JavaScript execution:** a dedicated Web Worker; source is instrumented
  with `acorn` (parse) + `astring` (regenerate) for the per-line trace
- Later: a backend sandbox for Java/C++, Supabase (accounts/save)

## Architecture

```
Monaco Editor                          src/components/editor
   ↓
Execution engine (per language)        public/workers/{pyodide,js}.worker.js
   ↓                                   src/lib/execution/{pyodide,js}-client.ts
Entry synthesis (LeetCode-paste)       src/lib/execution/entry/
   ↓
Snapshot trace                         (line, variables, call stack per step)
   ↓
State store (Zustand)                  src/lib/store/execution-store.ts
   ↓
Classifier + narrator (rules-based)    src/lib/explain/
   ↓
Visualizer engine (11 visualizers)     src/components/visualizers
   ↓
UI (Explain / Complexity / Output)     src/components
```

The contract between every language's worker and the UI lives in
`src/types/snapshot.ts` (`Snapshot`, `StackFrame`, `Variable`, `ValueNode`,
`RunResult`). Adding a language means writing a new tracer that emits this
same shape — not a UI rebuild.

## Getting started

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000/app, paste or write code in the editor, hit
**Run**, then step through execution with the controls (or the ← / → arrow
keys, or Space to auto-play) and watch the variables, call stack, output,
and matching visualizer update at each step.

> The first Python run downloads the Pyodide runtime from the jsDelivr CDN,
> so it needs network access and takes a moment on first load. JavaScript
> has no such dependency.

## Project structure

```
public/workers/         Execution workers (Python + JavaScript)
src/app/                Next.js App Router: landing (/), workspace (/app),
                         interview mode (/app/interview)
src/components/
  editor/                Monaco code editor + language selector
  execution/             Run/step controls, output, inputs, stdin
  inspector/             Recursive value renderer
  visualizers/           11 DSA visualizers
  interview/              Interview mode UI
  landing/                Marketing page sections
  ui/                     shadcn/ui primitives
src/lib/
  execution/              Worker clients, entry synthesis, provider registry
  explain/                Rules-based classifier, narrator, complexity
  interview/               Interview problem bank + grading
  store/                   Zustand execution store
src/types/               Shared snapshot/value types
```

## Deploy

RunX is a static-friendly Next.js app with no backend/database dependency
for Python + JavaScript (Pyodide loads from a CDN; JS runs in its own
worker). To deploy on Vercel:

1. Import the repo at vercel.com (Add New → Project → pick this repo).
2. Leave build settings on their Next.js defaults.
3. After the first deploy, set `NEXT_PUBLIC_SITE_URL` to your assigned
   domain in Project Settings → Environment Variables, then redeploy.

@AGENTS.md

# RunX — Project Context

**What it is:** an AI-powered code-execution + DSA + complexity visualizer for students. Show *how* code runs (lines, variables, memory, call stack, data structures, complexity) — not just the output. Name is final: **RunX**.

**Status (2026-07-10):** Phase 1 + Phases 3–6 DONE. The **Explain** tab is now the primary surface: paste any Python → `classify.ts` picks an `AlgoKind` → `ExplainPanel`'s `AutoViz` dispatches to a visualizer in `src/components/visualizers/` (11 of them: Sort/BinarySearch/Graph/Tree/LinkedList/Iterative/Recursion/DPTable/HashMap/Trie/Heap + Array/Stack/Queue). Per-step narration is **structured & visual** (`narrate.ts` → before→after badges + live value chips, not prose). **LeetCode-paste works**: a bare `class Solution` with no driver is detected (`src/lib/execution/entry/`) and an `InputsPanel` collects per-param inputs so it runs. `npm run build` passes; tracer + entry synthesis validated against CPython. **JavaScript executes now (2026-07-10):** a language selector (Python + JS live; C/C++/Java "Coming Soon") switches to a dedicated JS Web Worker (`public/workers/js.worker.js`, `AsyncFunction`, never main-thread eval) behind the provider registry `src/lib/execution/providers.ts` — console output, errors, and stdin only; **no JS per-line tracer yet** (still the Phase 9 lift; needs a JS parser → ask first), so Explain shows a Python-only notice for JS. **Complexity works for JS (2026-07-11):** a per-language profile registry (`src/lib/explain/lang/`) gives `classify.ts` its source signals and supplies static `ComplexityInfo` (rules-based JS scanner: scaling-loop nesting + recursion shape, no parser dependency) that the store fills into `result.complexity` when a worker doesn't emit it — same panel, same rules-decide-the-class guarantee; a new language = one new profile file. **⚠️ Known gap:** DPTable/Trie/HashMap/Heap visualizers are wired but unreachable — `classify.ts` never emits those kinds; needs the classifier extended (see `docs/TASKS.md`). **Scope (2026-06-22): Python + JavaScript + Java + C++ + a robustness/polish pass — see `docs/ROADMAP.md`.**

**Real stack (what's installed):** Next.js 16 (App Router) + TS, Tailwind v4 + shadcn/ui (Radix), Zustand, Pyodide 0.28.3 (loaded from CDN, runs in a classic Web Worker), Monaco, Framer Motion, React Flow (`@xyflow/react`) + `d3`/`d3-hierarchy`. Later: a JS tracer (AST instrumentation, own Web Worker), a backend sandbox for Java/C++ (Docker + GDB-MI / source instrumentation), Supabase, OpenAI/Gemini.

**Where things live:**
- Python tracer (the engine): `public/workers/pyodide.worker.js`
- Worker↔UI contract (most important file): `src/types/snapshot.ts` — the `ValueNode` tree; all visualizers read this. **This contract is what makes multi-language tractable** — every new language is a tracer that emits this same shape, not a UI rebuild.
- Worker clients: `src/lib/execution/pyodide-client.ts` (Python) + `js-client.ts` (JS, worker at `public/workers/js.worker.js`), looked up per language via `src/lib/execution/providers.ts` · Store: `src/lib/store/execution-store.ts`
- UI: `src/components/{editor,execution,inspector,visualizers,ui}` · Future: `src/lib/ai`, `src/lib/supabase`, a per-language tracer under `src/lib/execution/`

**Rules to follow:**
- Ask before adding any new major dependency outside the stack above — this includes anything Phase 9 (multi-language) needs: a JS parser, a backend framework/runtime, sandboxing tooling.
- Complexity *class* = rules-based (loop nesting + recursion detection), per language. The LLM only writes the explanation — it never decides the class.
- AI / API keys: server-side only (Route Handlers / Server Actions), never in the client.
- Run user code only inside an isolated worker or sandbox, never on the main thread or our own infra unisolated — Python: Pyodide worker; JS: its own dedicated worker; Java/C++: a sandboxed backend container (never executed directly on the host).
- Don't bump `react-resizable-panels` past v3 (v4 renames exports and breaks shadcn). Pyodide version is a const in the worker — verify the CDN dir exists before changing it.

# Build plan (short, for my own tracking — full detail in `docs/ROADMAP.md`)

Phases 1, 3–6 = DONE (foundation, memory boxes, call-stack polish, linear DSA views, algorithm animations).

Replanned 2026-06-22 around ~40 remaining days, scope now Python + JS + Java + C++:

- **Day 1–3** — Finish Phase 7: `GraphView`, BFS/DFS/Dijkstra step animations.
- **Day 4–6** — Phase 8: rules-based complexity-class detector (Python) + provider-agnostic LLM explanation interface + result panel UI.
- **Day 7–26** — Phase 9, multi-language engines, the big lift: JS tracer (Day 7–11, client-side, $0 infra) → backend sandbox infra (Day 12–18, ~$10–20/mo VPS) → Java tracer (Day 19–22) → C++ tracer (Day 23–26, highest risk — let this slip first if time tightens).
- **Day 27–31** — Phase 10: AI teacher (per-step explanation) + a presentation/execution-robustness pass across all views and languages.
- **Day 32–36** — Phase 11: watch variables/breakpoints + Supabase auth/save/share.
- **Day 37–40** — Phase 12: Interview mode (Python-first), tests, deploy (Vercel + sandbox VPS), landing page + docs.

> Every phase still reuses the `ValueNode`/`Snapshot` contract — new languages mean new tracers feeding the same store and views, not a UI rebuild.

# How we work (team)

This project belongs to **Vumi (owner)**. **Shiv** is the collaborator. Flow: tasks are planned for both → Shiv does his own tasks → Shiv forwards Vumi her tasks.

**Default split:** Vumi takes self-contained visual components / UI panels (one file or a small set, clear data in → clear visual out, low integration risk). Shiv takes the engine, the data contract (`src/types/snapshot.ts`), store wiring, AI/backend, and anything touching many files.

## Vumi task format — ALWAYS use this when asked to "give Vumi's task"

Simple, polite, easy language, **Hinglish** where it reads naturally. Copy-paste ready so she just reads and starts. Every task has these 4 parts, in order:

1. **Kya karna hai** — what to build (1–2 lines).
2. **Kyun** — why it matters / where it fits.
3. **Approach** — how to do it, simple step-by-step.
4. **Files aur unme kya karna hai** — each file path + exactly what to add/change in it.

Template:

> ### Vumi's Task: &lt;title&gt;
> Hi Vumi! 👋
>
> **1. Kya karna hai:** …
> **2. Kyun:** …
> **3. Approach:** …
> **4. Files aur unme kya karna hai:**
> - `path/to/file` — …
> - `path/to/file` — …
>
> Koi doubt ho toh poochh lena! 😊

# Docs map (where details live)

- `CLAUDE.md` (this file) — context, rules, short plan, how-we-work. Loaded every session.
- `README.md` — public project intro + how to run.
- `docs/ARCHITECTURE.md` — deep technical reference (data flow, snapshot contract, worker, store, how to add a visualizer).
- `docs/ROADMAP.md` — full replanned schedule (~40 days, multi-language) with per-phase checklists + task split.
- `docs/TASKS.md` — live task board (done / in-progress / up-next, with assignees).

@AGENTS.md

# RunX — Project Context

**What it is:** an AI-powered code-execution + DSA + complexity visualizer for students. Show *how* code runs (lines, variables, memory, call stack, data structures, complexity) — not just the output. Name is final: **RunX**.

**Status:** Phase 1 DONE — Monaco editor → Pyodide worker (`sys.settrace`) → per-line snapshots → Zustand store → variable inspector, with run / step-forward / step-back / jump-slider controls. `npm run build` passes; tracer logic validated against CPython.

**Real stack (what's installed):** Next.js 16 (App Router) + TS, Tailwind v4 + shadcn/ui (Radix), Zustand, Pyodide 0.28.3 (loaded from CDN, runs in a classic Web Worker), Monaco. Later: Framer Motion, React Flow + D3, Supabase, OpenAI/Gemini.

**Where things live:**
- Python tracer (the engine): `public/workers/pyodide.worker.js`
- Worker↔UI contract (most important file): `src/types/snapshot.ts` — the `ValueNode` tree; all visualizers read this.
- Worker client: `src/lib/execution/pyodide-client.ts` · Store: `src/lib/store/execution-store.ts`
- UI: `src/components/{editor,execution,inspector,visualizers,ui}` · Future: `src/lib/ai`, `src/lib/supabase`

**Rules to follow:**
- Ask before adding any new major dependency outside the stack above.
- Complexity *class* = rules-based (loop nesting + recursion detection). The LLM only writes the explanation — it never decides the class.
- AI / API keys: server-side only (Route Handlers / Server Actions), never in the client.
- Run Python only in the worker, never on the main thread.
- Don't bump `react-resizable-panels` past v3 (v4 renames exports and breaks shadcn). Pyodide version is a const in the worker — verify the CDN dir exists before changing it.

# 45-day build plan (short, for my own tracking)

Phase 1 (editor → exec → snapshots → inspector) = DONE.

- **Day 1–4** — Memory boxes: draw each variable as a box; use `ValueNode.id` to show shared references / aliasing. *(Phase 3)*
- **Day 5–7** — Polish the call-stack view: clean nested frames, clear recursion display. *(Phase 4)*
- **Day 8–15** — Linear DSA visualizers: array, stack, queue, linked list. Detect the structure from `ValueNode`, animate changes per step. *(Phase 5)*
- **Day 16–21** — Algorithm animations: sorting (bubble / selection / merge / quick) + search (linear / binary) with Framer Motion. *(Phase 6)*
- **Day 22–26** — Trees & graphs with React Flow + D3 (build the views first; BFS / DFS / Dijkstra animations after).
- **Day 27–31** — Complexity analyzer: rules-based class detector + provider-agnostic LLM layer for the natural-language explanation. *(Phase 7)*
- **Day 32–35** — AI teacher: per-step plain-English explanation via the same LLM interface. *(Phase 8)*
- **Day 36–38** — Time-travel debugger: jump to any step, watch a variable, optional breakpoints. *(Phase 9)*
- **Day 39–41** — Supabase: auth (email + OAuth), save / load snippets, share a trace via link.
- **Day 42–43** — Interview mode: user solves a DSA problem → report complexity + optimization tips. *(Phase 10)*
- **Day 44–45** — Polish, basic tests, deploy to Vercel, landing page + docs.

> Each phase reuses the `ValueNode`/`Snapshot` data already produced by the worker — usually no engine changes needed, just new views that read the current snapshot from the store.

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
- `docs/ROADMAP.md` — full 45-day plan with per-phase checklists + task split.
- `docs/TASKS.md` — live task board (done / in-progress / up-next, with assignees).

@AGENTS.md

# RunX — Project Context

**What it is:** an AI-powered code-execution + DSA + complexity visualizer for students. Show *how* code runs (lines, variables, memory, call stack, data structures, complexity) — not just the output. Name is final: **RunX**.

**Status (2026-07-12):** Phase 1 + Phases 3–6 DONE, and **Python and JavaScript are now equal citizens end to end.** The **Explain** tab is the primary surface for both: paste code → `classify.ts` picks an `AlgoKind` (rules-based, per-language) → `ExplainPanel`'s `AutoViz` dispatches to a visualizer in `src/components/visualizers/` (11 of them: Sort/BinarySearch/Graph/Tree/LinkedList/Iterative/Recursion/DPTable/HashMap/Trie/Heap + Array/Stack/Queue — all reachable, the classifier emits every kind). Per-step narration is **structured & visual** (`narrate.ts` → before→after badges + live value chips) and is language-agnostic; `src/lib/explain/expr.ts`'s sub-expression evaluator understands both Python and JS syntax. **LeetCode-paste works for both languages**: a bare `class Solution`/free function with no driver is detected (`src/lib/execution/entry/{python,javascript}.ts`) and an `InputsPanel` collects per-param inputs so it runs. **JavaScript has a full per-line tracer (shipped 2026-07-12):** source is instrumented on the main thread (`src/lib/execution/js-tracer/instrument.ts`, using **acorn** to parse + **astring** to regenerate — the one approved multi-language dependency so far) and run in `public/workers/js.worker.js`, which emits the same `Snapshot[]`/`ValueNode` trace Python's `sys.settrace` produces — line, call, and return events, with captured return values, honoring the store's step/depth budget. Complexity for JS comes from a per-language profile registry (`src/lib/explain/lang/`). **Interview mode shipped (2026-07-12), Python + JS both** (ahead of the original Python-first plan): `/app/interview` (`src/components/interview/`, data in `src/lib/interview/problems.ts`) reuses the exact same execution/entry/classify pipeline — a problem's starter is just a driverless function — plus rules-based grading (`src/lib/interview/grade.ts`: measured complexity vs. the problem's target, loose output-text match). No LLM anywhere in this path. `npm run build` passes, 206 vitest tests pass. **Remaining scope: Java + C++ — see `docs/ROADMAP.md`** (needs a backend sandbox; explicitly deferred, discuss before starting).

**Real stack (what's installed):** Next.js 16 (App Router) + TS, Tailwind v4 + shadcn/ui (Radix), Zustand, Pyodide 0.28.3 (loaded from CDN, runs in a classic Web Worker), Monaco, Framer Motion, React Flow (`@xyflow/react`) + `d3`/`d3-hierarchy`, **acorn + astring** (JS parse/regenerate for the tracer and entry detection — approved 2026-07-12, no further JS-parsing deps needed). Later: a backend sandbox for Java/C++ (Docker + GDB-MI / source instrumentation), Supabase, OpenAI/Gemini.

**Where things live:**
- Python tracer (the engine): `public/workers/pyodide.worker.js`. JS tracer: `src/lib/execution/js-tracer/instrument.ts` (instruments) + `public/workers/js.worker.js` (runs + serializes).
- Worker↔UI contract (most important file): `src/types/snapshot.ts` — the `ValueNode` tree; all visualizers read this. **This contract is what makes multi-language tractable** — every new language is a tracer that emits this same shape, not a UI rebuild.
- Worker clients: `src/lib/execution/pyodide-client.ts` (Python) + `js-client.ts` (JS, worker at `public/workers/js.worker.js`), looked up per language via `src/lib/execution/providers.ts` · Store: `src/lib/store/execution-store.ts`
- Entry synthesis (LeetCode-paste): `src/lib/execution/entry/{python,javascript}.ts`, registry in `entry/index.ts`.
- Interview mode: `src/lib/interview/{problems,grade}.ts` (data + rules-based grading, no LLM) + `src/components/interview/` (`InterviewWorkspace`, `ProblemPanel`, `ProblemPicker`, `Timer`) · route `src/app/app/interview/page.tsx`.
- UI: `src/components/{editor,execution,inspector,visualizers,interview,ui}` · Future: `src/lib/ai`, `src/lib/supabase`, a per-language tracer under `src/lib/execution/` for Java/C++.

**Rules to follow:**
- Ask before adding any new major dependency outside the stack above — this includes anything Java/C++ needs: a backend framework/runtime, sandboxing tooling. (acorn/astring are already approved and installed — no need to re-ask for JS parsing.)
- Complexity *class* = rules-based (loop nesting + recursion detection), per language. The LLM only writes the explanation — it never decides the class.
- **The AI teacher (per-step LLM explanation) is CANCELLED** (decided 2026-07-07) — do not wire an LLM provider or re-propose it. The scaffold (`src/lib/ai/explain.ts` + `POST /api/explain`) stays an unconfigured no-op; the deterministic rules narrator is the only explanation path, including in Interview mode's tips/grading.
- AI / API keys: server-side only (Route Handlers / Server Actions), never in the client.
- Run user code only inside an isolated worker or sandbox, never on the main thread or our own infra unisolated — Python: Pyodide worker; JS: its own dedicated worker; Java/C++: a sandboxed backend container (never executed directly on the host).
- Don't bump `react-resizable-panels` past v3 (v4 renames exports and breaks shadcn). Pyodide version is a const in the worker — verify the CDN dir exists before changing it.

# Build plan (short, for my own tracking — full detail in `docs/ROADMAP.md`)

Phases 1, 3–6 = DONE (foundation, memory boxes, call-stack polish, linear DSA views, algorithm animations).

Replanned 2026-06-22 around ~40 remaining days, scope now Python + JS + Java + C++:

- **Day 1–3** — Finish Phase 7: `GraphView`, BFS/DFS/Dijkstra step animations. ✅ DONE
- **Day 4–6** — Phase 8: rules-based complexity-class detector (Python) + provider-agnostic LLM explanation interface + result panel UI. ✅ DONE (LLM interface stays an unwired scaffold — see Phase 10 note below)
- **Day 7–26** — Phase 9, multi-language engines, the big lift: JS tracer (Day 7–11, client-side, $0 infra) ✅ DONE 2026-07-12 (acorn + astring instrumentation, full Snapshot trace) → backend sandbox infra (Day 12–18, ~$10–20/mo VPS) → Java tracer (Day 19–22) → C++ tracer (Day 23–26, highest risk — let this slip first if time tightens). **Java/C++ not started — the sandbox decision needs discussion before beginning.**
- **Day 27–31** — Phase 10: AI teacher (per-step explanation) — **CANCELLED 2026-07-07, do not build.** The presentation/execution-robustness half of this phase is effectively done (JS is now as robust as Python).
- **Day 32–36** — Phase 11: watch variables/breakpoints + Supabase auth/save/share. Not started. Note: share-by-link already shipped earlier via URL encoding (`#s=…`, see `src/lib/share.ts`) with no Supabase — Supabase is only needed for accounts/persistent save, not for what exists today.
- **Day 37–40** — Phase 12: Interview mode, tests, deploy (Vercel + sandbox VPS), landing page + docs. **Interview mode ✅ DONE 2026-07-12 — Python AND JavaScript both** (better than the original Python-first plan, since JS complexity/tracing were already in place). Landing page done separately (see AuthKit redesign, 2026-07-09 through -12). Deploy and docs still open.

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

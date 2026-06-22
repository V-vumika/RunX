# RunX — Roadmap (replanned 2026-06-22)

Short version is in `CLAUDE.md`. This is the fuller plan with checklists and the
who-does-what split.

**Scope expanded 2026-06-22:** RunX now targets **Python, JavaScript, Java, and
C++**, plus a general pass on execution robustness and visual presentation.
~40 days remain from this point. Phases already shipped are marked done and
left untouched below — only the remaining schedule was replanned.

## Task split principle

- 🟣 **Vumi (owner)** — self-contained visual components & panels. One file or a
  small set, clear data in (`ValueNode` / `Snapshot`), clear visual out, low
  integration risk.
- 🔵 **Shiv** — engine, snapshot contract, store, integration,
  AI layer, backend (Supabase), multi-language tracers, anything touching many files.

## Why multi-language fits in the time left

Every visualizer — memory boxes, call stack, DSA views, sort/search
animations, trees/graphs — reads one shared contract: `ValueNode` /
`Snapshot` (`src/types/snapshot.ts`). Adding a language means building **one
more tracer that emits that same shape**, not rebuilding the UI. That's the
leverage that makes four languages fit in 40 days instead of needing four
times the time.

Per-language approach, cheapest/lowest-risk first:

- **JavaScript** — runs client-side like Python. No `sys.settrace` equivalent,
  so the tracer parses the source (e.g. via `acorn`) and injects a snapshot
  call after each statement, then runs the instrumented code in its own
  dedicated Web Worker. $0 infra.
- **Java** — no in-browser execution; needs a backend sandbox. MVP approach:
  instrument the source (inject a reflection-based "dump locals" call after
  each statement) rather than driving a full JDI debugger session — faster to
  ship, good enough for student-level code.
- **C++** — no in-browser execution and no reflection either. Compile with
  `-g` and drive line-stepping + variable reads through **GDB's machine
  interface (MI)** — gdb already understands types from debug symbols,
  including most STL containers via its pretty-printers. **Highest-risk item
  of the three** — if the schedule tightens, this is what should slip first.

**New infra:** one small VPS (Hetzner/DigitalOcean, ~$10–20/month) running
Docker + `isolate`-style sandboxing for Java/C++ — self-hosting
[Piston](https://github.com/engineer-man/piston)'s approach rather than
building isolation from scratch. This is a new always-on operational
dependency (something to monitor/secure) distinct from the Vercel-hosted
frontend; ship/deploy steps in Phase 12 need to cover both.

**If time runs short, cut in this order:** (1) C++ tracer — drop to "best
effort" or defer past day 40; (2) multi-language Interview Mode — keep that
phase Python-only; (3) breadth of the presentation-polish pass. Don't cut
Python-side AI/complexity/accounts work or the JS/Java tracers — those are
the core commitment.

## Phases

### Phase 1 — Foundation ✅ DONE
- [x] Scaffold Next.js + TS + Tailwind + shadcn/ui
- [x] Monaco editor, Pyodide worker + `sys.settrace`, snapshot contract
- [x] Zustand store + step controls, Variable Inspector / Call Stack / Output

### Phase 3 — Memory boxes ✅ DONE
- [x] 🟣 `MemoryView` — draw each variable as a box (name + value)
- [x] 🔵 use `ValueNode.id` to show shared references / aliasing — `src/lib/visualizers/aliasing.ts` (`buildAliasMap`)
- [x] 🔵 wire into the workspace layout — Memory tab + `MemoryView` scaffold

### Phase 4 — Call-stack visual polish ✅ DONE
- [x] 🟣 nicer nested frame cards, clear recursion display
- [x] 🔵 highlight active frame as you step

### Phase 5 — Linear DSA visualizers ✅ DONE
- [x] 🟣 `ArrayView`, `StackView`, `QueueView`, `LinkedListView`
- [x] 🔵 structure detection from `ValueNode` + per-step diff/animation hooks

### Phase 6 — Algorithm animations ✅ DONE
- [x] 🟣 sorting views: bubble / selection / merge / quick (Framer Motion)
- [x] 🟣 searching views: linear / binary
- [x] 🔵 step-to-animation mapping helpers

### Phase 7 — Trees & graphs (Day 1–3) 🚧 IN PROGRESS
- [x] 🔵 structure detection for tree/graph shapes + baseline `TreeView` (React Flow + D3)
- [x] 🟣 polish `TreeView` (card style, legend, null-leaf indicator)
- [x] 🔵 reshape-animation fix (real CSS `transform` transition) — this is the pattern every future animated view should follow; Framer Motion alone can't reach into React Flow's node positioning
- [ ] 🟣 `GraphView` with React Flow + D3
- [ ] 🔵 BFS / DFS / Dijkstra step animations

### Phase 8 — Complexity analyzer (Day 4–6)
- [ ] 🔵 rules-based class detector for Python (loop nesting + recursion shape) — **decides the class, always; never the LLM**
- [ ] 🔵 provider-agnostic LLM interface (one function signature, swappable provider) — writes the explanation only; reused by Phase 10's AI teacher
- [ ] 🟣 complexity result panel UI

### Phase 9 — Multi-language engines (Day 7–26) — the big lift
- [ ] 🔵 (Day 7–11) **JavaScript tracer** — AST instrumentation, dedicated Web Worker, mapped into `ValueNode`
- [ ] 🔵 (Day 12–18) **Backend sandbox infra** — self-hosted Piston-style Docker sandbox on a small VPS; minimal "submit code + language → get trace stream" API
- [ ] 🔵 (Day 19–22) **Java tracer** — source instrumentation (reflection-based locals dump) on the sandbox, mapped into `ValueNode`
- [ ] 🔵 (Day 23–26) **C++ tracer** — GDB/MI-driven stepping on the sandbox, mapped into `ValueNode` — highest risk, see cut order above
- [ ] 🔵 extend Phase 8's complexity-class rules to each new language's AST as its tracer lands (same loop-nesting/recursion-shape logic, different AST walker per language)
- [ ] 🟣 language picker UI (paste code, pick Python / JS / Java / C++)
- [ ] 🟣 any per-language view tweaks existing visualizers need — expected to be minimal, that's the point of the shared contract

### Phase 10 — AI teacher + presentation/execution polish (Day 27–31)
- [ ] 🔵 per-step plain-English explanation via Phase 8's LLM interface
- [ ] 🟣 explanation panel UI
- [ ] 🔵🟣 presentation pass — every visualizer should animate reshapes with a real CSS transition (Phase 7's fix), not just trees/sorting; consistency pass on card style/legends across views
- [ ] 🔵 execution-robustness pass — timeout + infinite-loop guards for all 4 languages, friendlier error display

### Phase 11 — Time-travel extras + Accounts (Day 32–36)
- [ ] 🔵 watch variables + optional breakpoints (step back/forward/jump-slider already exist from Phase 1 — this is the incremental part)
- [ ] 🟣 timeline / watch UI
- [ ] 🔵 Supabase auth (email + OAuth), save/load snippets (now stores language alongside code), share a trace by link

### Phase 12 — Interview mode + Polish & ship (Day 37–40)
- [ ] 🔵 interview mode: solve a DSA problem → complexity + optimization tips, reusing Phase 8's detector — **scoped to Python first**; multi-language interview mode is a stretch goal past day 40
- [ ] 🟣 interview-mode UI
- [ ] basic tests, deploy frontend to Vercel **and** the sandbox VPS, landing page + docs

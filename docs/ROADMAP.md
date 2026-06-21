# RunX — 45-Day Roadmap (detailed)

Short version is in `CLAUDE.md`. This is the fuller plan with checklists and the
who-does-what split.

## Task split principle

- 🟣 **Vumi (owner)** — self-contained visual components & panels. One file or a
  small set, clear data in (`ValueNode` / `Snapshot`), clear visual out, low
  integration risk.
- 🔵 **Shiv** — engine, snapshot contract, store, integration,
  AI layer, backend (Supabase), anything touching many files.

## Phases

### Phase 1 — Foundation ✅ DONE
- [x] Scaffold Next.js + TS + Tailwind + shadcn/ui
- [x] Monaco editor, Pyodide worker + `sys.settrace`, snapshot contract
- [x] Zustand store + step controls, Variable Inspector / Call Stack / Output

### Phase 3 — Memory boxes (Day 1–4) ✅ DONE
- [x] 🟣 `MemoryView` — draw each variable as a box (name + value)
- [x] 🔵 use `ValueNode.id` to show shared references / aliasing — `src/lib/visualizers/aliasing.ts` (`buildAliasMap`)
- [x] 🔵 wire into the workspace layout — Memory tab + `MemoryView` scaffold

### Phase 4 — Call-stack visual polish (Day 5–7) ✅ DONE
- [x] 🟣 nicer nested frame cards, clear recursion display
- [x] 🔵 highlight active frame as you step

### Phase 5 — Linear DSA visualizers (Day 8–15) ✅ DONE
- [x] 🟣 `ArrayView`, `StackView`, `QueueView`, `LinkedListView`
- [x] 🔵 structure detection from `ValueNode` + per-step diff/animation hooks

### Phase 6 — Algorithm animations (Day 16–21) ✅ DONE
- [x] 🟣 sorting views: bubble / selection / merge / quick (Framer Motion)
- [x] 🟣 searching views: linear / binary
- [x] 🔵 step-to-animation mapping helpers

### Phase — Trees & graphs (Day 22–26) 🚧 IN PROGRESS
- [x] 🔵 structure detection for tree/graph shapes + baseline `TreeView` (React Flow + D3)
- [ ] 🟣 polish `TreeView` (visual language, animation, null-child indicator)
- [ ] 🟣 `GraphView` with React Flow + D3
- [ ] 🔵 BFS / DFS / Dijkstra step animations (after views work)

### Phase 7 — Complexity analyzer (Day 27–31)
- [ ] 🔵 rules-based class detector (loop nesting + recursion) — **decides the class**
- [ ] 🔵 provider-agnostic LLM layer writes the explanation (never the class)
- [ ] 🟣 complexity result panel UI

### Phase 8 — AI teacher (Day 32–35)
- [ ] 🔵 per-step plain-English explanation via the same LLM interface
- [ ] 🟣 explanation panel UI

### Phase 9 — Time-travel debugger (Day 36–38)
- [ ] 🔵 jump to any step, watch a variable, optional breakpoints
- [ ] 🟣 timeline / watch UI

### Phase — Accounts & sharing (Day 39–41)
- [ ] 🔵 Supabase auth (email + OAuth), save/load snippets, share trace by link

### Phase 10 — Interview mode (Day 42–43)
- [ ] 🔵 solve DSA problem → report complexity + optimization tips
- [ ] 🟣 interview-mode UI

### Polish & ship (Day 44–45)
- [ ] basic tests, deploy to Vercel, landing page + docs

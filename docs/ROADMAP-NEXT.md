# RunX — Forward Roadmap (post-hardening, 2026-07-05)

The 3-phase hardening plan (`docs/HARDENING.md`) is DONE. This is the next arc.
**Strategic call: depth-first** — make Python genuinely great before the multi-language lift.
Multi-language stays committed, just sequenced later. Owners: 🔵 Shiv (engine/contract), 🟣 Vumi (views).

## Phase 4 — DSA visual coverage (close the "generic-only" gap)
The common LeetCode patterns that currently fall to the generic view.
- ✅ **4.1 Pointer / sliding-window overlay** — `src/lib/visualizers/pointers.ts` (`detectPointers`,
  name-gated + range-gated) attaches to array structures in `detect-live.ts`; `ArrayView` marks each
  pointer (`left↓`/`right↓`/…) on its cell and shades the window between the extremes. 5 tests. Fires only
  on plain-array scans (sort/binary-search have their own views).
- ✅ **4.2 String view** — `StringView.tsx`: indexed character cells with the same pointer/window overlay,
  shown when pointers traverse a string (palindrome / two-pointer-on-string).
- ✅ **4.3 Grid view** — `grid.ts` + `GridView.tsx`: named 2-D grids (islands/maze/board) render as a
  traversal grid with the current (row,col) cursor + visited cells, distinct from the DP table. DP tables
  (`dp`/`memo`/…) still route to `DPTableViz`.
- ✅ **4.4 Backtracking view** — classifier kind `backtracking` + `BacktrackingView.tsx`: shows the current
  candidate path (building/unwinding) and the results collected so far, distinct from the raw call stack.
- ⏭ **4.5 1D-DP fill** — *deferred:* a 1-D `dp` array already gets the ArrayView + pointer overlay (the fill
  index `i` highlights the current cell). The extra value (showing the recurrence dependencies) is really
  Phase 5.1 expression-substitution work, so folded there.

**Phase 4 DONE** (4.1–4.4; 4.5 folded into P5). Tests: pointers, grid, classify-backtracking. 43 total.

## Phase 5 — Explanation depth (the "why", for all code)
- **5.1 Expression-level value substitution** 🔵 — show sub-expressions resolving inline
  (`min(2, 2) → 2`). Thonny's killer feature; the single biggest teaching upgrade.
- **5.2 Object / reference memory view** 🔵🟣 — aliasing + OOP relationships as a memory diagram.
- **5.3 Comprehension / generator stepping** 🔵 — step the inner iteration instead of one opaque line.

## Phase 6 — AI teacher
Per-step natural-language + "explain this", layered on the deterministic trace (provider-agnostic,
server-side). Only after the deterministic base is rich. Needs an API-key / cost decision.

## Phase 7 — Advanced DSA
Weighted graph / Dijkstra, Union-Find, Segment/Fenwick tree, intervals, bit-manipulation, sets.

## Phase 8 — Multi-language (committed)
JS tracer (own worker) → backend sandbox → Java → C++. Same `ValueNode`/`Snapshot` contract.

## Phase 9 — Product & ship
Supabase auth / save / share, watch + breakpoints, interview mode, landing page, deploy.

## Cross-cutting: Quality & Trust (continuous, not a phase)
- Consistency refactor — unify inline-style vs Tailwind across views; split the 16KB `DPTableViz`;
  finish killing name-guessing (node-refactor DP/HashMap/Heap).
- **Worker watchdog** — hard execution timeout → terminate/restart (no run should hang the UI).
- **Golden-trace tests** — real Pyodide snapshots as fixtures, so the *visual* layer has regression cover.
- **Scale** — the 2000-step cap kills real algorithms; trace virtualization + adaptive depth.
- Cheap wins — shareable URL (encode code+stdin), example gallery, mobile / empty-state polish.

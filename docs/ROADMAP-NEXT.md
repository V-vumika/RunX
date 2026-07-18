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
- ✅ **5.1 Expression-level value substitution** — `src/lib/explain/expr.ts` (`evaluateLine`): a small
  tokenizer + recursive-descent evaluator that resolves the sub-expressions on a line (indexing, arithmetic,
  comparisons, attributes, `len/min/max/abs/sum`) against the **already-captured `ValueNode` locals** — so
  no re-execution and zero side-effect risk. Wired into `narrate.ts` so the step's value chips now show
  `arr[i] = 3`, `arr[i-1] + 1 = 3`, `nums[mid] < target = True`. Falls back to plain variable values, and
  yields nothing on anything it can't resolve. 6 tests. (Absorbs the 4.5 1D-DP recurrence display.)
- ✅ **5.2 Object / reference memory view** — _(this originally shipped via `aliasing.ts`/`buildAliasMap` +
  `collectSharedRefs` + `MemoryView.tsx`; all three were later removed and superseded by live structure
  detection in `src/lib/visualizers/detect-live.ts`, which covers shared-reference display differently.)_
- ✅ **5.3 Comprehension / generator stepping** — Python 3.12+ already inlines comprehensions (the tracer
  fires a step per iteration with the loop var live), so the gap was the evaluator choking on `for`.
  `expr.ts` now reduces a comprehension line to its element (`x*x`, or the value of a dict comp) so the
  per-iteration value chips resolve (`x = 3`, `x*x = 9`). 2 tests.

**Phase 5 DONE** (5.1–5.3). 55 tests total.

## Phase 6 — AI teacher
Per-step natural-language + "explain this", layered on the deterministic trace (provider-agnostic,
server-side). Only after the deterministic base is rich. Needs an API-key / cost decision.

## Phase 7 — Advanced DSA
- ✅ **Union-Find** — `union-find.ts` + `UnionFindView.tsx`: a DSU `parent` self-index array renders as
  connected components (grouped by root, colored, roots ringed). 4 tests.
- ✅ **Intervals** — `intervals.ts` + `IntervalsView.tsx`: a named list of `[start, end]` pairs renders as a
  shared timeline so overlaps/gaps are visible. 3 tests.
- ✅ **Sets** — `SetView.tsx`: unordered members as chips (no misleading indices).
- ✅ **Frequency counter** — `counter.ts` + `CounterView.tsx`: a Counter/tally dict as sorted bars.
- ✅ **Bitmask / binary** — `binary.ts` + `BinaryView.tsx`: a `mask`-named int (with bit ops in the code) as
  a labeled bit row, set bits highlighted.
- ✅ **Weighted graph / Dijkstra** — `graph.ts` (`parseGraph`/`parseDist`/`parseFrontierNodes`) is the pure,
  tested core; `GraphViz` now understands weighted adjacency ((neighbour, weight) tuples **or**
  {neighbour: weight} dicts), draws edge-weight labels, shows the running shortest distance under each node,
  and highlights the heap frontier (pulling the node out of `(dist, node)` heap tuples). Classifier emits new
  `AlgoKind` `"dijkstra"` (graph + heapq + a distance map, or a `dijkstra`/`shortest-path` name) → O((V+E) log V);
  wired into `AutoViz` + badge. BFS/DFS rendering unchanged. 10 tests (graph + classify).
- ✅ **Fenwick / BIT** — `fenwick.ts` + `FenwickView.tsx`: a BIT-named int array (gated on the lowbit `i & -i`
  source idiom so it never hijacks a plain list named `tree`) renders each slot with the index range it
  aggregates (`[i - lowbit(i) + 1 .. i]`) — the thing a flat array view can't show. Wired via `detect-live`. 5 tests.
- ✅ **Segment tree** — `segment-tree.ts` + `SegmentTreeView.tsx`: a seg-named number array (gated on the
  `2*i` / `i<<1` child-indexing idiom) drawn as the implicit binary tree it is (node `i` → `2i`/`2i+1`), each
  node showing its value and — for a perfect power-of-two size — the range it aggregates. Non-perfect/padded
  arrays render the value tree with zero subtrees pruned. Wired via `detect-live`. 5 tests.
- ✅ **Weighted-graph edge-relaxation animation** — `GraphViz` now separates the popped node `u` from the
  neighbour `v` under test, lights the edge being relaxed with marching dashes, and pulses a green ring +
  green distance label on any node whose shortest distance dropped since the previous step (diffed against
  `snapshots[step-1]`'s `dist`). SMIL animations, self-contained. **Phase 7 fully done.**

## Phase 8 — Multi-language (committed)
JS tracer (own worker) → backend sandbox → Java → C++. Same `ValueNode`/`Snapshot` contract.

## Phase 9 — Product & ship
Supabase auth / save / share, watch + breakpoints, interview mode, landing page, deploy.

## Cross-cutting: Quality & Trust (continuous, not a phase)
- ✅ **Worker watchdog** — `pyodide-client` now arms a timeout per run (60s load budget → 12s exec budget
  once the worker signals `running`); on overrun it terminates the hung worker, rejects with a clear
  "timed out" message, and lazily re-inits. No run can hang the UI forever.
- ✅ **Golden-trace tests** — `src/lib/__fixtures__/*.json` are REAL traces captured by running the worker's
  own Python under CPython (`scripts/gen-golden-fixtures.py`); `golden.test.ts` runs the full
  classify/detect/narrate pipeline on them, guarding the whole serialization contract. 6 tests (61 total).
- Consistency refactor — unify inline-style vs Tailwind across views; split the 16KB `DPTableViz`;
  finish killing name-guessing (node-refactor DP/HashMap/Heap). *(pending)*
- ✅ **Scale** — the old 2000-step cap *aborted* real algorithms mid-run (you never saw the result). Now the
  worker records up to an **adaptive** budget (`step-budget.ts`, scales with program size, 4k–10k) and then
  keeps running without recording so the program **finishes** — appending one synthetic final-state snapshot
  of the module globals, with a `hard_limit` on executed lines as the runaway guard (the client watchdog is
  the wall-clock backstop). `Snapshot.final` flags it; `ExplainPanel` shows a "trace capped — still finished"
  notice. 4 tests.
- ◑ Cheap wins — ✅ **shareable URL** (`lib/share.ts`, encodes code+stdin into a `#s=` hash, no backend; a
  Share button in the header + restore-on-load in `Workspace`; 5 tests) · ✅ **example gallery** (`lib/examples.ts`
  + `ExampleGallery` in the Explain empty state — 6 one-click starters spanning sort/search/BST/Dijkstra/trie/
  recursion) · ✅ **empty-state polish**. _Mobile polish intentionally skipped — RunX isn't targeting mobile._

# RunX — Core Hardening Plan (2026-07-05)

Depth before breadth: make Python rock-solid and *general* before the multi-language lift.
Scope from the architecture review. **AI teacher is intentionally excluded** here (separate track);
Supabase / watch-breakpoints also deferred (product features, not core-hardening).

Each phase is independently shippable. Owner: 🔵 Shiv (engine/contract), 🟣 Vumi (visual polish).

---

## Phase 1 — Harden the core (correctness + "works for every code")  ✅ DONE (2026-07-05)
*Goal: any Python that runs shows a genuinely useful, correct view; nothing fails silently; regressions get caught.*

- ✅ **1.1 Bulletproof generic fallback** 🔵 — `GenericViz` (`src/components/visualizers/GenericViz.tsx`)
  wired into `AutoViz`'s `default`. Renders every frame variable as a rich nested value card (reuses
  `ValueView`) with new/changed highlighting. Unmatched programs now always show useful data instead of nothing.
- ✅ **1.2 Unsupported-code detection + friendly errors** 🔵 — `src/lib/execution/support-check.ts`
  (`preflightCheck`). Blocks `input()` (would hang) with a clear message; warns on network / file / threads /
  async. Surfaced in `ExplainPanel` (block screen + amber warning banner); store holds `supportWarnings`.
- ✅ **1.3 Regression test corpus** 🔵 — `vitest` added (dev dep); `npm test`. 22 tests across
  `support-check`, `entry/python`, `narrate`, `classify` — the classifier tests lock in "structure beats
  name heuristics" (Trie/LinkedList with a `search()` method must not become linear-search). Config runs
  serially (`fileParallelism: false`) to dodge a Windows/vitest-4 worker-pool bug.

**Exit:** ✅ paste anything that runs → useful view or a clear reason; `npm test` green (22).

## Phase 2 — Visualization architecture (per-structure, robust, complete)  ✅ DONE (2026-07-05)
*Goal: right view(s) for any recognizable structure, no name-guessing, all visualizers reachable.*

- ✅ **2.1 Per-variable structure detection** — `src/lib/visualizers/detect-live.ts` (`detectLiveStructures`)
  scans the current frame's variables (shape via `detectStructure`), dedupes aliases by object id, tags
  each with a diff state, and promotes a scalar list to a heap only with a `heapq` source signal.
- ✅ **2.2 Multi-viz dispatch** — `StructureList.tsx` renders a view per detected structure (several at once).
  `AlgoKind` now drives only the algorithm summary + algorithm/wrapped-structure animation (`AutoViz`
  trimmed to sort/binary-search/recursion/bfs-dfs/tree/linked-list/trie/iterative); flat data structures
  come from detection. Duplicate flat views suppressed when the algorithm view already draws the list.
- ◑ **2.3 Name-guessing** — flat views (Array/Stack/Queue) are node-based (no guessing); DP/HashMap
  self-locate by **shape** (not name); Heap uses a name hint consistent with detection. *Residual:* the
  wrapped views (Tree/Trie/LinkedList) keep their own root-finding (`head`/`root`/`_snapshot`) — that's
  genuine wrapper-unwrapping, not blind guessing, so left as-is. Node-refactor of DP/HashMap/Heap is a
  future refinement.
- ✅ **2.4 Remaining dead visualizers reachable** — DPTable (matrix), HashMap (dict), Heap (heapq list) now
  render via detection instead of the never-emitted `AlgoKind`s. Trie was wired in Phase-1 prep.

Tests: `detect-live.test.ts` (multi-structure, alias dedupe, heap promotion, diff state). 27 total.

**Exit:** ✅ mixed-structure programs show a view each; dispatch is structure-driven; DP/HashMap/Heap reachable.

## Phase 3 — Reach & depth (coverage + insight)  ✅ DONE (2026-07-05)
*Goal: cover the biggest missing input case and make complexity convincing.*

- ✅ **3.1 stdin support** — the Pyodide worker (`__runx_run`) now takes `stdin_text`, shadows `input()` in
  the user's globals and swaps `sys.stdin` to a buffer, so `input()` / `sys.stdin.read()` both work
  (validated against CPython). Client `RunOptions.stdin` → store `stdin`/`setStdin` → new `StdinPanel`
  (shown when `usesStdin(code)`). `input()` is no longer a preflight block.
- ✅ **3.2 Empirical complexity** — `src/lib/explain/measure.ts` (`measureRun`) counts real operations
  (line executions), function calls, peak depth, and detected input size from the trace; shown in
  `ComplexityPanel` as a "Measured this run" card group beside the theoretical class (honest single-run
  facts + ops÷n, not a guessed curve). Capped runs are flagged as a lower bound.
- ✅ **3.3 Robustness / presentation polish** — `ArrayView` empty state added (Stack/Queue already had one);
  detection feeds arbitrary data safely.

Tests: `measure.test.ts` (+ updated `support-check` for stdin). 32 total.

**Exit:** ✅ `input()` code runs with a stdin box; complexity shows measured operations for the run.

---

## Status: all three phases DONE (2026-07-05). Next track = Phase 9 multi-language (JS → sandbox → Java → C++), per `docs/ROADMAP.md`. Deferred from this plan: AI teacher, Supabase, watch/breakpoints.

---

### Known coverage limits (be honest with users)
- **Tracing is general** for deterministic, self-contained, standard-library Python that finishes fast.
- **Breaks/degrades** on: `input()`/file/network/async/threads, native C-ext libs, >2000 steps,
  structures deeper/wider than the serializer caps. Phase 1.2 makes these fail *clearly*; Phase 3.1 fixes stdin.
- **Rich DSA views** are pattern-matched to common shapes — not every implementation. Phase 1.1 guarantees a
  good *generic* view for the rest; Phase 2 widens real coverage.

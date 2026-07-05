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

## Phase 2 — Visualization architecture (per-structure, robust, complete)
*Goal: right view(s) for any recognizable structure, no name-guessing, all visualizers reachable.*

- **2.1 Per-variable structure detection** surfaced to the panel (a program can hold several live structures).
- **2.2 Multi-viz dispatch** — render a view per live structure, not one global `AlgoKind`. Keep `AlgoKind`
  only for the algorithm summary / complexity.
- **2.3 Kill hardcoded variable-name guessing** in visualizers — drive from detected structure + generic
  walking (no more reactive `head`/`_snapshot`/`root` patches).
- **2.4 Wire remaining dead visualizers** (heap, dp, hashmap) under the new model, each verified live.

**Exit:** mixed-structure programs visualize correctly; no name-guessing; all 11 visualizers reachable.

## Phase 3 — Reach & depth (coverage + insight)
*Goal: cover the biggest missing input case and make complexity convincing.*

- **3.1 stdin support** — input box feeding `sys.stdin`, so `input()`-based code runs. Highest-value add.
- **3.2 Empirical complexity** — measure ops/steps vs input size; plot alongside the rules-based class.
- **3.3 Robustness / presentation polish** across all views + edge cases.

**Exit:** `input()` code runs; complexity shown empirically.

---

### Known coverage limits (be honest with users)
- **Tracing is general** for deterministic, self-contained, standard-library Python that finishes fast.
- **Breaks/degrades** on: `input()`/file/network/async/threads, native C-ext libs, >2000 steps,
  structures deeper/wider than the serializer caps. Phase 1.2 makes these fail *clearly*; Phase 3.1 fixes stdin.
- **Rich DSA views** are pattern-matched to common shapes — not every implementation. Phase 1.1 guarantees a
  good *generic* view for the rest; Phase 2 widens real coverage.

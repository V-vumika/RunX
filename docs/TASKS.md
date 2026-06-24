# RunX — Task Board

Live status. Update as we go. Assignees: 🟣 **Vumi** (owner) · 🔵 **Shiv** (Collabrator)

> **2026-06-22 — scope replanned:** RunX now targets Python + JavaScript + Java + C++ (was Python-only), plus a presentation/execution polish pass. Phase numbers below are unchanged for already-done work; new phases (8 onward) follow the replanned sequence in `docs/ROADMAP.md`.

## ✅ Done
- **Phase 1** — editor → exec → snapshots → store → inspector + step controls 🔵
- 🟣 **Vumi — Local setup** (git pull → `npm install` → `npm run dev` → verified)
- 🟣 **Vumi — Example code buttons** (`src/components/editor/ExamplePicker.tsx` + wired into `src/components/Workspace.tsx`) — build/tsc/lint clean — _removed 2026-06-24 in the Explain-mode pivot (see below); the app no longer steers users toward pre-picked examples._
- **Phase 3 — Memory boxes** — 🔵 aliasing detection + 🟣 `MemoryView` boxes with shared-ref color borders (verified in browser: `a`/`b` aliasing highlights correctly, `c` correctly unhighlighted)
- **Phase 4 — Call-stack polish** — 🔵 `stack-analysis.ts` + 🟣 redesigned `CallStackPanel` (indentation, active-frame highlight, recursion "call #N" badges) — verified in browser with `factorial(4)`
- 🔵 **Bugfix** — arrow-key stepping was leaking into Radix Tabs' own keyboard nav (clicking a tab then pressing ←/→ silently flipped the active tab). Fixed via capture-phase + `stopPropagation` in `ExecutionControls.tsx`. Caught during Day 1/2 verification.
- **Phase 5 — Linear DSA visualizers** — 🔵 structure detection (`structure-detect.ts`), step diff (`step-diff.ts`), `DsaPanel` dispatcher, and final styled `ArrayView` / `StackView` / `QueueView` / `LinkedListView` (Vumi's pass only touched a 1-line class fix in `ArrayView`; the other 3 views were still scaffolds, so Shiv styled all 4 to match `MemoryView`/`CallStackPanel`). Verified live in browser for array, stack, queue, and linked-list samples.
- 🔵 **Bugfix** — `collections.deque` had no serializer branch in the tracer (`pyodide.worker.js`), so any `deque` rendered as `(empty)` in `QueueView` even with items. Added a dedicated `deque` `ValueKind` + serializer branch; `detectStructure` now recognizes any `deque` as a queue by shape, not just by variable name.
- 🔵 **Bugfix** — `detectStructure`'s name-hint matching (`/node|linked|head|tail/i` etc.) applied even to non-container kinds, so a `class Node:` (kind `"function"`) got force-rendered as a broken linked-list box. Name hints are now gated to container-like kinds only (`list`/`tuple`/`set`/`deque`/`dict`/`object`). Caught during Day 3 verification with a real `class Node` linked-list sample.

## ✅ Done (cont.)
- **Phase 6 — Algorithm animations** (sorting + searching)
  - 🔵 installed `framer-motion`; built `sort-trace.ts` (derives "which indices are being compared" from the current source line + locals, and "which indices just got swapped" from a value-level diff vs the previous step); new `AlgorithmPanel` dispatcher + "Algorithms" tab in `Workspace.tsx`; `SortBarsView` baseline. Verified live against Bubble Sort and Linear Search — compare/swap highlights land on the right indices at the right steps.
  - 🟣 **Vumi** — animated `SortBarsView` with Framer Motion (`motion.div` + `layout` for bars sliding on swap, animated amber/rose highlight transitions, compare/swap legend). Done well.
  - 🔵 **Bugfix** — Vumi's commit also touched `DsaPanel.tsx`, wiring the same sort-highlight logic into the general DSA tab (out of scope for the task, which was scoped to `SortBarsView.tsx` only). It passed `String(snapshot.line)` (a line *number*) as the source-line argument to `computeSortHighlight` instead of the actual line text, so "comparing" highlights could never fire there — only "swapped" worked. Also architecturally wrong: it duplicated `AlgorithmPanel`'s logic in a second file and made the DSA tab unpredictably swap from box-cells to a bar chart for *any* array with a recent value change, not just ones being deliberately sorted. Reverted `DsaPanel.tsx` to its plain `ArrayView` rendering — sort animation stays solely in the dedicated Algorithms tab. Verified via Playwright: DSA tab now shows plain array cells through a full Bubble Sort run.
  - 🔵 added the remaining roadmap algorithms as examples in `ExamplePicker.tsx` — Selection Sort, Quick Sort, Merge Sort, Binary Search — to actually exercise `sort-trace.ts` beyond bubble sort. Verified all four live: Quick Sort's in-place partition swaps highlight correctly across recursive calls (same `arr` identity is preserved through `quick_sort(arr, low, i)` / `quick_sort(arr, i + 2, high)`); Merge Sort's `left`/`right`/`result` sub-arrays render per-recursion-frame with no spurious swap highlights (correct — merge never swaps in place); Binary Search shows single-index "comparing" highlights with no swaps. No crashes, no engine changes needed — confirms the compare/swap signal layer is genuinely algorithm-agnostic.

## 🚧 In progress
- **Phase 7 — Trees & graphs** (kickoff)
  - 🔵 installed `@xyflow/react` (React Flow) + `d3` + `@types/d3`.
  - 🔵 extended `detectStructure` (`structure-detect.ts`) with `"tree"` (any object with a `left`/`right` attribute) and `"graph"` (an object with `nodes`+`edges` attrs, or a dict that's a pure adjacency list — every value a list/tuple/set/deque). Restructured the function so shape checks (`left`/`right`, `next`, `nodes`/`edges`) always run *before* name hints — previously a tree node parameter literally named `node` was misclassified as `linked-list` because the `LINKED_LIST_NAME` regex fired before any attribute was inspected.
  - 🔵 built `TreeView.tsx` — walks a `ValueNode`'s `left`/`right` chain into a plain tree, lays it out with `d3-hierarchy`'s `tree()` for real top-down coordinates, renders with React Flow. Wired into `DsaPanel.tsx`. Left a doc comment in the file addressed to Vumi for the polish pass (visual language, animation, null-child indicator) — her next task.
  - 🔵 added a "Binary Search Tree" example (`ExamplePicker.tsx`) to exercise tree detection — recursive `insert(root, val)` building a BST from 8 values.
  - 🔵 verified live: BST grows correctly across steps, root/children render as a real top-down tree with correct parent→child edges; non-tree scopes (e.g. `self`/`val` mid-`__init__`, before `left`/`right` are set) correctly fall back to the plain value row instead of crashing or misrendering.
  - GraphView not started yet — `"graph"` detection exists but `DsaPanel` has no dispatch branch for it, falls through to the generic fallback row safely.
  - 🟣 **Vumi** — `TreeView` polish: card style matching `ArrayView`/`StackView` (sky-300 label, legend swatches, "binary tree" badge), dashed "∅" null-leaf indicator for missing children. Done well.
  - 🔵 **Bugfix** — Vumi's polish added a Framer Motion fade/scale on the canvas, but it's a `motion.div` with no key tied to tree shape, so `initial`→`animate` only plays once on mount, not on each insert — the actual ask ("animate node position changes when the tree reshapes") wasn't covered, since React Flow doesn't transition a node's position by itself. Added a CSS rule (`globals.css`, `.runx-animated-flow .react-flow__node { transition: transform 300ms ease }`, applied via a class on the canvas wrapper) — React Flow moves nodes with a CSS `transform`, so this is what actually produces the slide when siblings shift on insert. Verified live: `getComputedStyle` on a rendered node now reports `transitionProperty: transform`, `0.3s`.

- **Explain mode — Thonny-style "paste any code → walk through it"** (product pivot, 2026-06-24)
  - 🔵 Removed the demo `ExamplePicker` (9 labelled examples) + its `Workspace.tsx` usages, deleted the file. Entry point is now "paste any Python code" — auto-detection already drives the visualizers, so nothing relied on labelled examples to select a view.
  - 🔵 `src/lib/explain/narrate.ts` — rules-based per-step narrator: diffs consecutive snapshots (reuses `step-diff.ts` + `stack-analysis.ts`) into plain English ("appended 5 to `result`", "swapped `arr[1]` ↔ `arr[2]`", "Call `fib(3)` — recursive call #3", "`fact()` returns 24"). No LLM, no key, offline.
  - 🔵 `src/lib/explain/classify.ts` — rules-based program classifier: sort / binary-search / linear-search / BFS / DFS / tree / linked-list / recursion / nested-loop / iterative / script, from source (indentation loop-nesting + name hints) + trace (recursion depth, swaps, detected structures), plus a heuristic Big-O class. **Class is rules-decided, never the LLM** (project rule). Honestly heuristic — Phase 8 formalizes with a real AST walker.
  - 🔵 LLM scaffold, no provider wired yet: `src/lib/ai/explain.ts` (server-side, provider-agnostic, returns `{text:null, configured:false}` until a key is set) + `POST /api/explain` route. Rules narrator is the live path; LLM is purely additive.
  - 🔵 `src/components/explain/ExplainPanel.tsx` + new **Explain** tab (now the default): summary card (title + Big-O + signals), current-step explanation, clickable running walkthrough, "Explain with AI" button that degrades gracefully with no provider. Baseline built — **visual polish is Vumi's next task.**
  - 🔵 `npm run build` clean.

## How tasks flow
1. Shiv writes the task (for 🟣 or 🔵).
2. Shiv does the 🔵 tasks.
3. Shiv forwards 🟣 tasks to Vumi in the Hinglish format (template in `CLAUDE.md`).
4. Mark items done here as they land.

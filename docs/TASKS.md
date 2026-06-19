# RunX — Task Board

Live status. Update as we go. Assignees: 🟣 **Vumi** (owner) · 🔵 **Shiv** (Collabrator)

## ✅ Done
- **Phase 1** — editor → exec → snapshots → store → inspector + step controls 🔵
- 🟣 **Vumi — Local setup** (git pull → `npm install` → `npm run dev` → verified)
- 🟣 **Vumi — Example code buttons** (`src/components/editor/ExamplePicker.tsx` + wired into `src/components/Workspace.tsx`) — build/tsc/lint clean
- **Phase 3 — Memory boxes** — 🔵 aliasing detection + 🟣 `MemoryView` boxes with shared-ref color borders (verified in browser: `a`/`b` aliasing highlights correctly, `c` correctly unhighlighted)
- **Phase 4 — Call-stack polish** — 🔵 `stack-analysis.ts` + 🟣 redesigned `CallStackPanel` (indentation, active-frame highlight, recursion "call #N" badges) — verified in browser with `factorial(4)`
- 🔵 **Bugfix** — arrow-key stepping was leaking into Radix Tabs' own keyboard nav (clicking a tab then pressing ←/→ silently flipped the active tab). Fixed via capture-phase + `stopPropagation` in `ExecutionControls.tsx`. Caught during Day 1/2 verification.
- **Phase 5 — Linear DSA visualizers** — 🔵 structure detection (`structure-detect.ts`), step diff (`step-diff.ts`), `DsaPanel` dispatcher, and final styled `ArrayView` / `StackView` / `QueueView` / `LinkedListView` (Vumi's pass only touched a 1-line class fix in `ArrayView`; the other 3 views were still scaffolds, so Shiv styled all 4 to match `MemoryView`/`CallStackPanel`). Verified live in browser for array, stack, queue, and linked-list samples.
- 🔵 **Bugfix** — `collections.deque` had no serializer branch in the tracer (`pyodide.worker.js`), so any `deque` rendered as `(empty)` in `QueueView` even with items. Added a dedicated `deque` `ValueKind` + serializer branch; `detectStructure` now recognizes any `deque` as a queue by shape, not just by variable name.
- 🔵 **Bugfix** — `detectStructure`'s name-hint matching (`/node|linked|head|tail/i` etc.) applied even to non-container kinds, so a `class Node:` (kind `"function"`) got force-rendered as a broken linked-list box. Name hints are now gated to container-like kinds only (`list`/`tuple`/`set`/`deque`/`dict`/`object`). Caught during Day 3 verification with a real `class Node` linked-list sample.

## 🚧 In progress
- **Phase 6 — Algorithm animations** (sorting + searching)
  - 🔵 DONE — installed `framer-motion`; built `sort-trace.ts` (derives "which indices are being compared" from the current source line + locals, and "which indices just got swapped" from a value-level diff vs the previous step); new `AlgorithmPanel` dispatcher + "Algorithms" tab in `Workspace.tsx`; `SortBarsView` baseline (correct bars + amber/rose highlight, no animation yet). Verified live against the real Bubble Sort and Linear Search examples — compare/swap highlights land on the right indices at the right steps.
  - 🟣 **Vumi (Day 4 — tomorrow)** — add the actual Framer Motion animation to `SortBarsView` (see the doc comment at the top of the file for specifics: smooth highlight transitions + bars sliding past each other on swap, plus a small compared/swapped legend).

## How tasks flow
1. Shiv writes the task (for 🟣 or 🔵).
2. Shiv does the 🔵 tasks.
3. Shiv forwards 🟣 tasks to Vumi in the Hinglish format (template in `CLAUDE.md`).
4. Mark items done here as they land.

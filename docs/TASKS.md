# RunX — Task Board

Live status. Update as we go. Assignees: 🟣 **Vumi** (owner) · 🔵 **Shiv** (Collabrator)

## ✅ Done
- **Phase 1** — editor → exec → snapshots → store → inspector + step controls 🔵
- 🟣 **Vumi — Local setup** (git pull → `npm install` → `npm run dev` → verified)
- 🟣 **Vumi — Example code buttons** (`src/components/editor/ExamplePicker.tsx` + wired into `src/components/Workspace.tsx`) — build/tsc/lint clean
- **Phase 3 — Memory boxes** — 🔵 aliasing detection + 🟣 `MemoryView` boxes with shared-ref color borders (verified in browser: `a`/`b` aliasing highlights correctly, `c` correctly unhighlighted)
- **Phase 4 — Call-stack polish** — 🔵 `stack-analysis.ts` + 🟣 redesigned `CallStackPanel` (indentation, active-frame highlight, recursion "call #N" badges) — verified in browser with `factorial(4)`
- 🔵 **Bugfix** — arrow-key stepping was leaking into Radix Tabs' own keyboard nav (clicking a tab then pressing ←/→ silently flipped the active tab). Fixed via capture-phase + `stopPropagation` in `ExecutionControls.tsx`. Caught during Day 1/2 verification.

## 🚧 In progress
- **Phase 5 — Linear DSA visualizers**
  - 🔵 DONE — structure detection (`structure-detect.ts`), step diff (`step-diff.ts`), all 4 view scaffolds + `DsaPanel` dispatcher wired into layout
  - 🟣 **Vumi (Day 3 — tomorrow)** — flesh out `ArrayView`, `StackView`, `QueueView`, `LinkedListView` in `src/components/visualizers/`

## ⏭️ Up next
- **Phase 6 — Algorithm animations** (sorting + searching with Framer Motion)

## How tasks flow
1. Shiv writes the task (for 🟣 or 🔵).
2. Shiv does the 🔵 tasks.
3. Shiv forwards 🟣 tasks to Vumi in the Hinglish format (template in `CLAUDE.md`).
4. Mark items done here as they land.

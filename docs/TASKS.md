# RunX — Task Board

Live status. Update as we go. Assignees: 🟣 **Vumi** (owner) · 🔵 **Shiv** (Collabrator)

## ✅ Done
- **Phase 1** — editor → exec → snapshots → store → inspector + step controls 🔵
- 🟣 **Vumi — Local setup** (git pull → `npm install` → `npm run dev` → verified)
- 🟣 **Vumi — Example code buttons** (`src/components/editor/ExamplePicker.tsx` + wired into `src/components/Workspace.tsx`) — build/tsc/lint clean

## 🚧 In progress
- **Phase 3 — Memory boxes**
  - 🔵 DONE — aliasing detection + MemoryView scaffold + Memory tab wired
  - 🟣 **Vumi (Day 1)** — build out `MemoryView` real boxes + shared-ref color highlights (`src/components/visualizers/MemoryView.tsx`)
- **Phase 4 — Call-stack polish**
  - 🔵 DONE — `src/lib/visualizers/stack-analysis.ts` (`enrichFrames`, `frameLabel`, `EnrichedFrame`)
  - 🟣 **Vumi (Day 2)** — redesign `CallStackPanel` using `enrichFrames` (`src/components/execution/CallStackPanel.tsx`)
- **Phase 5 — Linear DSA visualizers**
  - 🔵 DONE — structure detection (`structure-detect.ts`), step diff (`step-diff.ts`), all 4 view scaffolds + `DsaPanel` dispatcher wired into layout
  - 🟣 **Vumi (Day 3)** — flesh out `ArrayView`, `StackView`, `QueueView`, `LinkedListView` in `src/components/visualizers/`

## ⏭️ Up next
- **Phase 6 — Algorithm animations** (sorting + searching with Framer Motion)
  - 🟣 `MemoryView` component
  - 🔵 reference/aliasing arrows via `ValueNode.id`

## How tasks flow
1. Shiv writes the task (for 🟣 or 🔵).
2. Shiv does the 🔵 tasks.
3. Shiv forwards 🟣 tasks to Vumi in the Hinglish format (template in `CLAUDE.md`).
4. Mark items done here as they land.

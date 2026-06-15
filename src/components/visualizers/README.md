# Visualizers

DSA / data-structure visual components, consuming the serialized `ValueNode`
tree from `src/types/snapshot.ts`.

Planned (build order):

1. **Memory boxes** — generic variable → box rendering (Phase 3).
2. **Linear structures** — `ArrayView`, `StackView`, `QueueView`, `LinkedListView` (Phase 5).
3. **Algorithm animations** — sorting (bubble/selection/merge/quick) and
   searching (linear/binary) as animated step sequences (Phase 6, Framer Motion).
4. **Graphs / trees** — `TreeView`, `GraphView` via React Flow + D3 (later).

Each visualizer reads the current snapshot from the execution store and renders
the relevant structure. They should be pure functions of `ValueNode` so they can
be reused across the inspector, time-travel debugger, and interview mode.

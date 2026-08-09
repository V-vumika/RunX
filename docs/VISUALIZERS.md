# Visualizer catalog

`CLAUDE.md` describes "11 visualizers," but that's the count of `AlgoKind`
algorithm views — the live per-variable structure detector
(`src/lib/visualizers/detect-live.ts` → `StructureList.tsx`) dispatches to
several more flat-data-structure views that aren't named anywhere else. This
file catalogs everything that actually exists in
`src/components/visualizers/`.

## Algorithm views (dispatched by `AlgoKind`, in `ExplainPanel.tsx`'s `AutoViz`)

| `AlgoKind` | Component |
|---|---|
| `sort` | `SortViz` |
| `recursion` | `RecursionViz` |
| `binary-search` | `BinarySearchViz` |
| `bfs` / `dfs` / `dijkstra` | `GraphViz` |
| `tree` | `TreeViz` |
| `linked-list` | `LinkedListViz` |
| `trie` | `TrieViz` |
| `backtracking` | `BacktrackingView` |
| `nested-loop` / `iterative` | `IterativeViz` |
| *(no algorithm view, no detected structure)* | `GenericViz` — universal fallback, renders every frame variable as a nested value card |

## Flat data-structure views (dispatched by live shape detection, in `StructureList.tsx`)

`ArrayView`, `StringView`, `SetView`, `GridView`, `UnionFindView`,
`IntervalsView`, `CounterView`, `BinaryView`, `FenwickView`,
`SegmentTreeView`, `StackView`, `QueueView`, `DPTableViz`, `HashMapViz`,
`HeapViz` — one renders per detected structure, so a program with two
unrelated structures (e.g. a grid *and* a hash map) shows both at once.

## Shared helper

`VizGradientDefs.tsx` — shared SVG `<defs>` (gradients) reused by the
SVG-based views above.

Adding a new one? See "Adding a visualizer" in `docs/ARCHITECTURE.md`.

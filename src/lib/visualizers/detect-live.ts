/**
 * Live-structure detection (Phase 2).
 *
 * Instead of collapsing a whole program to one `AlgoKind` and showing a single
 * visualizer, this scans the *current* frame's variables and reports every
 * renderable data structure at this step — so a program holding a list AND a
 * dict AND a heap shows all three. Detection is by shape (`detectStructure`),
 * never by a hardcoded variable name inside a view.
 *
 *   - array / generic-list / stack / queue → node-based views (one per variable)
 *   - matrix → DP table, dict → hashmap, heap → heap  (self-locating views,
 *     shown once per kind)
 *   - linked-list / tree / graph are wrapped structures with their own
 *     root-finding; they stay classifier-driven and are intentionally skipped here.
 */

import type { Snapshot, ValueNode } from "@/types/snapshot";
import { detectStructure, type StructureKind } from "./structure-detect";
import { detectPointers, type PointerOverlay } from "./pointers";

export type StructureView = "array" | "string" | "stack" | "queue" | "matrix" | "hashmap" | "heap";

/** Views that take an explicit `node`; the rest self-locate from snapshots. */
export const NODE_VIEWS: ReadonlySet<StructureView> = new Set(["array", "stack", "queue"]);

export interface LiveStructure {
  key: string;
  name: string;
  view: StructureView;
  node: ValueNode;
  diffState: "added" | "changed" | "unchanged";
  /** Two-pointer / sliding-window overlay for array views. */
  overlay?: PointerOverlay;
}

/** A heap is just a scalar list — only treat it as one with a source-level signal. */
function usesHeapq(code: string): boolean {
  return /\b(import\s+heapq|from\s+heapq)\b/.test(code) || /\bheap(push|pop|ify|replace|pushpop)\b/.test(code);
}

function viewForKind(kind: StructureKind): StructureView | null {
  switch (kind) {
    case "array":
    case "generic-list":
      return "array";
    case "matrix":
      return "matrix";
    case "stack":
      return "stack";
    case "queue":
      return "queue";
    case "dict":
      return "hashmap";
    default:
      return null; // linked-list / tree / graph / primitive / other
  }
}

export function detectLiveStructures(
  snap: Snapshot | undefined,
  prev: Snapshot | undefined,
  code: string
): LiveStructure[] {
  const frame = snap?.stack.at(-1);
  if (!frame) return [];

  const heapHint = usesHeapq(code);
  const prevReprs = new Map((prev?.stack.at(-1)?.locals ?? []).map((v) => [v.name, v.value.repr]));

  const out: LiveStructure[] = [];
  const seenIds = new Set<number>();

  for (const v of frame.locals) {
    if (v.name.startsWith("__")) continue;

    // A string being traversed by pointers gets a character view (else it's
    // just a scalar and stays in the variable list).
    if (v.value.kind === "str") {
      const len = typeof v.value.value === "string" ? v.value.value.length : 0;
      if (len >= 2) {
        const overlay = detectPointers(len, frame.locals);
        if (overlay.pointers.length > 0) {
          const before = prevReprs.get(v.name);
          const diffState = before === undefined ? "added" : before !== v.value.repr ? "changed" : "unchanged";
          out.push({ key: `${v.name}#str`, name: v.name, view: "string", node: v.value, diffState, overlay });
        }
      }
      continue;
    }

    const kind = detectStructure(v.name, v.value);
    let view = viewForKind(kind);
    // A heap is a scalar list; promote only with the heapq signal + a heap-ish name.
    if (heapHint && (kind === "array" || kind === "generic-list") && /heap|pq|priority/i.test(v.name)) {
      view = "heap";
    }
    if (!view) continue;

    // Dedupe aliases pointing at the same object.
    if (v.value.id != null) {
      if (seenIds.has(v.value.id)) continue;
      seenIds.add(v.value.id);
    }

    const before = prevReprs.get(v.name);
    const diffState = before === undefined ? "added" : before !== v.value.repr ? "changed" : "unchanged";
    // Pointer/window overlay only makes sense on a flat array.
    const overlay = view === "array" ? detectPointers(v.value.items?.length ?? 0, frame.locals) : undefined;

    out.push({ key: `${v.name}#${v.value.id ?? out.length}`, name: v.name, view, node: v.value, diffState, overlay });
  }

  return out.slice(0, 6);
}

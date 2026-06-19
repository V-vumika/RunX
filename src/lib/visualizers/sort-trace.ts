/**
 * Sort/search step signals for the algorithm-animation views (Phase 6).
 *
 * The tracer only records (line, locals, stdout) per step — it has no idea a
 * user's code is sorting anything. These two functions derive the two signals
 * a sort/search animation actually needs, using only what's already in a
 * Snapshot, the same way structure-detect.ts derives a structure kind from
 * shape + name instead of asking the engine to understand DSA semantics:
 *
 *   - "swapped"  — which array indices changed value since the previous step.
 *     This is a value diff, so it fires one step *after* an in-place
 *     assignment like `arr[j], arr[j+1] = arr[j+1], arr[j]` actually runs.
 *
 *   - "compared" — which array indices the *current* line reads, e.g. the `j`
 *     and `j+1` in `if arr[j] > arr[j+1]:`. This is a best-effort regex over
 *     the source line, resolved against the current frame's locals — it
 *     handles the patterns real algorithm code uses (a literal, a bare
 *     index variable, or `var ± small int`) and skips anything fancier.
 */

import type { ValueNode, Variable } from "@/types/snapshot";

/** Indices where a list/tuple/deque's element value changed since the previous step. */
export function diffArrayIndices(prev: ValueNode | null, curr: ValueNode): number[] {
  if (!prev || prev.kind !== curr.kind) return [];
  const prevItems = prev.items ?? [];
  const currItems = curr.items ?? [];
  const len = Math.min(prevItems.length, currItems.length);
  const changed: number[] = [];
  for (let i = 0; i < len; i++) {
    if (prevItems[i].repr !== currItems[i].repr) changed.push(i);
  }
  return changed;
}

function resolveIndex(expr: string, locals: Map<string, ValueNode>): number | null {
  const trimmed = expr.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed);

  const identMatch = /^([A-Za-z_]\w*)$/.exec(trimmed);
  if (identMatch) {
    const node = locals.get(identMatch[1]);
    return node?.kind === "int" && typeof node.value === "number" ? node.value : null;
  }

  const offsetMatch = /^([A-Za-z_]\w*)\s*([+-])\s*(\d+)$/.exec(trimmed);
  if (offsetMatch) {
    const node = locals.get(offsetMatch[1]);
    if (node?.kind !== "int" || typeof node.value !== "number") return null;
    const delta = Number(offsetMatch[3]) * (offsetMatch[2] === "-" ? -1 : 1);
    return node.value + delta;
  }

  return null;
}

/**
 * Finds `varName[<index>]` accesses on a source line and resolves each index
 * expression to a concrete integer using the frame's current locals.
 */
export function extractIndexAccesses(
  line: string,
  varName: string,
  locals: Variable[]
): number[] {
  const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const accessPattern = new RegExp(`\\b${escaped}\\s*\\[\\s*([^\\]]+?)\\s*\\]`, "g");
  const lookup = new Map(locals.map((v) => [v.name, v.value]));

  const indices = new Set<number>();
  let match: RegExpExecArray | null;
  while ((match = accessPattern.exec(line)) !== null) {
    const resolved = resolveIndex(match[1], lookup);
    if (resolved != null) indices.add(resolved);
  }
  return [...indices].sort((a, b) => a - b);
}

/** Combined compare/swap highlight for one array variable at the current step. */
export interface SortHighlight {
  compared: number[];
  swapped: number[];
}

export function computeSortHighlight(
  varName: string,
  node: ValueNode,
  prevNode: ValueNode | null,
  currentLine: string,
  locals: Variable[]
): SortHighlight {
  return {
    compared: extractIndexAccesses(currentLine, varName, locals),
    swapped: diffArrayIndices(prevNode, node),
  };
}

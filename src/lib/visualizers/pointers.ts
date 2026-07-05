/**
 * Pointer / sliding-window detection (Phase 4.1).
 *
 * Two-pointer and sliding-window problems are a huge share of array/string
 * work, but they show as a plain array today. This finds the integer variables
 * that are indexing into a given array — `left`/`right`, `lo`/`hi`, `i`/`j`,
 * `slow`/`fast`, etc. — so the view can mark them on the cells and shade the
 * window between the extremes.
 *
 * Detection is name-gated (index-ish names only) AND range-gated (the value
 * must be a valid index) to avoid flagging an unrelated counter that happens to
 * be in range. Binary search / sort have their own views, so this only ever
 * fires on plain-array scans.
 */

import type { Variable } from "@/types/snapshot";

export interface ArrayPointer {
  name: string;
  /** Index into the sequence. Equal to length means an exclusive end marker. */
  index: number;
}

export interface PointerOverlay {
  pointers: ArrayPointer[];
  /** Inclusive cell range to shade as the active window, or null. */
  window: { start: number; end: number } | null;
}

const POINTER_NAME =
  /^(l|r|lo|hi|low|high|left|right|i|j|k|start|end|slow|fast|mid|m|p|q|p1|p2|front|back|read|write|begin|first|last|left_?ptr|right_?ptr)$/i;

const EMPTY: PointerOverlay = { pointers: [], window: null };

/** Find index variables pointing into a sequence of the given length. */
export function detectPointers(len: number, locals: Variable[]): PointerOverlay {
  if (len <= 0) return EMPTY;

  const pointers: ArrayPointer[] = [];
  for (const v of locals) {
    if (v.value.kind !== "int" || !POINTER_NAME.test(v.name)) continue;
    const idx = typeof v.value.value === "number" ? v.value.value : Number(v.value.value);
    if (!Number.isInteger(idx) || idx < 0 || idx > len) continue; // len = exclusive end
    pointers.push({ name: v.name, index: idx });
    if (pointers.length >= 4) break; // avoid clutter
  }

  if (pointers.length === 0) return EMPTY;

  // Shade the window between the extreme pointers (clamped into the array).
  let window: PointerOverlay["window"] = null;
  if (pointers.length >= 2) {
    const idxs = pointers.map((p) => Math.min(p.index, len - 1));
    const start = Math.min(...idxs);
    const end = Math.max(...idxs);
    if (end > start) window = { start, end };
  }

  return { pointers, window };
}

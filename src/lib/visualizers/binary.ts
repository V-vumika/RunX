/**
 * Bitmask / binary detection (Phase 7).
 *
 * Bit-manipulation and bitmask-DP problems treat an int as a row of bits. We
 * only show the binary view for an int variable *named* like a mask AND when the
 * code actually uses bitwise operators — the name gate keeps ordinary integers
 * (counters, sums) from turning into bit rows even though `&`/`|` also mean set
 * ops elsewhere.
 */

import type { ValueNode } from "@/types/snapshot";

const BIT_NAME = /^(mask|bitmask|bits|bit|state|subset|flags)$/i;

export function hasBitOps(code: string): boolean {
  return /<<|>>|\^|~|&|\|/.test(code);
}

export function isBitVar(name: string, node: ValueNode, code: string): boolean {
  return node.kind === "int" && BIT_NAME.test(name) && hasBitOps(code);
}

export interface Bit {
  index: number;
  set: boolean;
}

/** Bits of `value`, most-significant first, at least `minWidth` wide. */
export function toBits(value: number, minWidth = 8): Bit[] {
  const v = Math.max(0, Math.floor(value)); // negatives aren't meaningful as a bit row here
  const need = v === 0 ? 1 : Math.floor(Math.log2(v)) + 1;
  const width = Math.max(minWidth, need);
  const out: Bit[] = [];
  for (let i = width - 1; i >= 0; i--) {
    out.push({ index: i, set: Math.floor(v / 2 ** i) % 2 === 1 });
  }
  return out;
}

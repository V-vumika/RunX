"use client";

import type { ValueNode } from "@/types/snapshot";
import { toBits } from "@/lib/visualizers/binary";

/**
 * BinaryView (Phase 7) — an int shown as its binary bits (bit-manipulation /
 * bitmask problems), set bits highlighted, with bit positions labeled.
 */
export function BinaryView({ name, node }: { name: string; node: ValueNode }) {
  const value = Number(node.value ?? 0);
  const bits = toBits(value);
  const setCount = bits.filter((b) => b.set).length;

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        <span>{name} · binary</span>
        <span className="normal-case text-muted-foreground/60">= {value} · {setCount} bit{setCount === 1 ? "" : "s"} set</span>
      </div>

      <div className="flex flex-wrap gap-1 bg-[#0b0b16] p-3">
        {bits.map((b) => (
          <div key={b.index} className="flex flex-col items-center gap-0.5">
            <div
              className={`flex size-7 items-center justify-center rounded-md border font-mono text-[13px] font-bold ${
                b.set
                  ? "border-amber-400 bg-amber-400/15 text-amber-200"
                  : "border-border/50 bg-muted/30 text-muted-foreground/50"
              }`}
            >
              {b.set ? "1" : "0"}
            </div>
            <span className="font-mono text-[8px] text-muted-foreground/50">{b.index}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

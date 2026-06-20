"use client";

import type { ValueNode } from "@/types/snapshot";
import { motion } from "framer-motion";

interface Props {
  name: string;
  node: ValueNode;
  compared: number[];
  swapped: number[];
}

function barHeight(node: ValueNode, max: number): number {
  if (typeof node.value !== "number" || max <= 0) return 24;
  const ratio = Math.abs(node.value) / max;
  return Math.max(8, Math.round(ratio * 96));
}

export function SortBarsView({ name, node, compared, swapped }: Props) {
  const items = node.items ?? [];
  const numericValues = items
    .map((item) => item.value)
    .filter((v): v is number => typeof v === "number");
  const max = numericValues.length > 0 ? Math.max(...numericValues.map(Math.abs)) : 0;

  return (
    <div className="rounded-xl border-2 bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[13px] font-medium text-sky-300">{name}</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
            <span className="text-[10px] text-muted-foreground">comparing</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-sm bg-rose-400" />
            <span className="text-[10px] text-muted-foreground">swapped</span>
          </div>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            sort trace
          </span>
        </div>
      </div>
      <div className="flex items-end gap-1.5" style={{ minHeight: 104 }}>
        {items.map((item, i) => {
          const isSwapped = swapped.includes(i);
          const isCompared = !isSwapped && compared.includes(i);
          return (
            <motion.div layout key={i} className="flex flex-col items-center gap-1">
              <motion.div
                layout
                animate={{
                  height: barHeight(item, max),
                  backgroundColor: isSwapped
                    ? "rgba(251,113,133,0.2)"
                    : isCompared
                      ? "rgba(251,191,36,0.2)"
                      : "rgba(63,63,70,0.4)",
                  borderColor: isSwapped
                    ? "rgb(251,113,133)"
                    : isCompared
                      ? "rgb(251,191,36)"
                      : "rgba(63,63,70,0.6)",
                }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="flex w-8 items-end justify-center rounded-t-md border-2 font-mono text-[11px]"
              >
                <span className="pb-0.5">{item.repr}</span>
              </motion.div>
              <span className="font-mono text-[10px] text-muted-foreground">{i}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

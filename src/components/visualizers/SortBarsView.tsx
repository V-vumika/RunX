"use client";

/**
 * SortBarsView — bar-chart visualization of an array being sorted/searched.
 *
 * 🟣 Vumi: this is YOUR component to build out (Phase 6, Day 4).
 *
 * The data layer is already done and verified — `compared`/`swapped` are
 * computed per step in `src/lib/visualizers/sort-trace.ts` and passed in as
 * props. `compared` = indices the current line is reading (e.g. `arr[j]` in
 * `if arr[j] > arr[j+1]:`). `swapped` = indices whose value just changed
 * versus the previous step. The baseline below already renders correct bars
 * with the right indices ringed amber/rose at the right steps (verified
 * against the Bubble Sort and Linear Search examples in the Examples menu)
 * — what's missing is the *animation*.
 *
 * What to add:
 *   - Use `framer-motion` (already installed) to animate bar height changes
 *     and the compare/swap highlight as smooth transitions instead of an
 *     instant class swap — wrap each bar in `motion.div` and animate
 *     `backgroundColor`/`borderColor`/`scale` based on `compared`/`swapped`.
 *   - When two bars swap, animate them sliding past each other rather than
 *     just snapping to their new positions (the array's value order already
 *     updates correctly step to step — `layout` on each bar's `motion.div`
 *     gets you most of the way there for free).
 *   - A small color legend (compared = amber, swapped = rose) somewhere in
 *     the header would help — see ArrayView/StackView for the existing
 *     badge style to match.
 *
 * Props:
 *   - `node`     — the ValueNode for the array (kind: "list" — items are
 *                  the bars, in current order)
 *   - `name`     — the variable name (display as label)
 *   - `compared` — indices currently being compared (highlight amber)
 *   - `swapped`  — indices whose value changed last step (highlight rose)
 */

import type { ValueNode } from "@/types/snapshot";

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
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          sort trace
        </span>
      </div>
      <div className="flex items-end gap-1.5" style={{ minHeight: 104 }}>
        {items.map((item, i) => {
          const isSwapped = swapped.includes(i);
          const isCompared = !isSwapped && compared.includes(i);
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={`flex w-8 items-end justify-center rounded-t-md border-2 font-mono text-[11px] ${
                  isSwapped
                    ? "border-rose-400 bg-rose-400/20"
                    : isCompared
                      ? "border-amber-400 bg-amber-400/20"
                      : "border-border/60 bg-muted/40"
                }`}
                style={{ height: barHeight(item, max) }}
              >
                <span className="pb-0.5">{item.repr}</span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">{i}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import type { Snapshot } from "@/types/snapshot";
import { ValueView } from "@/components/inspector/ValueView";

/**
 * The universal fallback view. When no algorithm/structure visualizer matches
 * (or a program is just a plain script), every program still gets a genuinely
 * useful picture of its data: each variable in the current frame rendered as a
 * rich, fully-nested value card (via {@link ValueView}), with new/changed
 * variables highlighted against the previous step.
 *
 * This is the "works for every code" guarantee — it must never return an empty
 * or broken view for anything that ran.
 */

function topLocals(s: Snapshot | undefined) {
  return (s?.stack.at(-1)?.locals ?? []).filter((v) => !v.name.startsWith("__"));
}

export function GenericViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const snap = snapshots[step];
  const frame = snap?.stack.at(-1);
  if (!frame) return null;

  const vars = (frame.locals ?? []).filter((v) => !v.name.startsWith("__"));
  if (vars.length === 0) return null;

  const prev = new Map(topLocals(snapshots[step - 1]).map((v) => [v.name, v.value.repr]));
  const scope = frame.functionName === "<module>" ? "global scope" : `${frame.functionName}()`;

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        <span>data · {scope}</span>
        <span className="normal-case text-muted-foreground/50">
          {vars.length} variable{vars.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="max-h-90 space-y-1.5 overflow-auto bg-[#0b0b16] p-2.5">
        {vars.map((v) => {
          const isNew = !prev.has(v.name);
          const changed = !isNew && prev.get(v.name) !== v.value.repr;
          const active = isNew || changed;
          return (
            <div
              key={v.name}
              className="rounded-md border px-2.5 py-1.5 transition-colors"
              style={{
                borderColor: active ? "#1D9E7555" : "#26264a",
                background: active ? "#0E3B2C22" : "transparent",
              }}
            >
              <div className="mb-0.5 flex items-center gap-2">
                <span className="font-mono text-[12px] font-semibold text-sky-300">{v.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground/40">{v.value.pyType}</span>
                {active && (
                  <span className="ml-auto rounded bg-emerald-500/20 px-1 py-0.5 text-[8px] uppercase tracking-wide text-emerald-300/80">
                    {isNew ? "new" : "changed"}
                  </span>
                )}
              </div>
              <div className="wrap-break-word">
                <ValueView node={v.value} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

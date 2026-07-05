"use client";

import type { Snapshot, ValueNode } from "@/types/snapshot";
import { shortRepr } from "@/lib/explain/narrate";

const PATH_NAMES = ["path", "current", "curr", "cur", "temp", "tmp", "comb", "combo", "subset", "perm", "candidate", "sol", "solution", "board", "state"];
const RESULT_NAMES = ["result", "results", "res", "ans", "answer", "output", "combinations", "permutations", "subsets", "ret", "out"];

function findList(frame: { locals: { name: string; value: ValueNode }[] } | undefined, names: string[]): { name: string; value: ValueNode } | undefined {
  if (!frame) return undefined;
  for (const n of names) {
    const v = frame.locals.find((l) => l.name === n && (l.value.kind === "list" || l.value.kind === "tuple" || l.value.kind === "set"));
    if (v) return v;
  }
  return undefined;
}

/**
 * BacktrackingView (Phase 4.4) — the candidate being built and the choices
 * collected, distinct from the raw call stack. Shows the current partial path
 * (growing/shrinking as we recurse and undo) and the results found so far.
 */
export function BacktrackingView({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const snap = snapshots[step];
  if (!snap) return null;

  // Path is usually a local in the current frame; results often live in an outer frame.
  const top = snap.stack.at(-1);
  const path = findList(top, PATH_NAMES);
  let result: { name: string; value: ValueNode } | undefined;
  for (let i = snap.stack.length - 1; i >= 0 && !result; i--) {
    result = findList(snap.stack[i], RESULT_NAMES);
  }

  if (!path && !result) return null;

  const pathItems = path?.value.items ?? [];
  const resultItems = result?.value.items ?? [];
  const depth = snap.stack.length;

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        <span>backtracking</span>
        <span className="normal-case text-muted-foreground/60">depth {depth}</span>
      </div>

      <div className="space-y-2.5 bg-[#0b0b16] p-3">
        {/* current candidate path */}
        {path && (
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground/60">
              current <span className="font-mono lowercase text-violet-300">{path.name}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {pathItems.length === 0 ? (
                <span className="rounded border border-dashed px-2 py-1 text-[11px] text-muted-foreground/50">empty</span>
              ) : (
                pathItems.map((it, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="text-muted-foreground/30">→</span>}
                    <span className="rounded-md border border-violet-500/40 bg-violet-500/12 px-2 py-1 font-mono text-[12px] text-violet-200">
                      {shortRepr(it, 6)}
                    </span>
                  </span>
                ))
              )}
            </div>
          </div>
        )}

        {/* results collected so far */}
        {result && (
          <div>
            <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground/60">
              found <span className="font-mono lowercase text-emerald-300">{result.name}</span>
              <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-emerald-300/80">{resultItems.length}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {resultItems.slice(-8).map((it, i) => (
                <span key={i} className="rounded border border-emerald-500/30 bg-emerald-500/8 px-1.5 py-0.5 font-mono text-[11px] text-emerald-200/90">
                  {shortRepr(it, 14)}
                </span>
              ))}
              {resultItems.length > 8 && <span className="px-1 py-0.5 text-[10px] text-muted-foreground/50">…</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

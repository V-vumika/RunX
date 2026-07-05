"use client";

import type { ValueNode } from "@/types/snapshot";
import type { PointerOverlay } from "@/lib/visualizers/pointers";

/**
 * StringView (Phase 4.2) — a string as indexed character cells, with the same
 * two-pointer / window overlay as ArrayView. Shown only when pointers are
 * traversing the string (palindrome, two-pointer, sliding window on chars).
 */
export function StringView({
  name,
  node,
  overlay,
}: {
  name: string;
  node: ValueNode;
  overlay?: PointerOverlay;
}) {
  const raw = typeof node.value === "string" ? node.value : node.repr.replace(/^['"]|['"]$/g, "");
  const chars = [...raw];

  const pointers = overlay?.pointers ?? [];
  const window = overlay?.window ?? null;
  const ptrsAt = (i: number) => pointers.filter((p) => p.index === i);
  const inWindow = (i: number) => window != null && i >= window.start && i <= window.end;
  const endPointers = pointers.filter((p) => p.index === chars.length && chars.length > 0);

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        <span>{name} · string</span>
        {pointers.length > 0 && (
          <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[9px] normal-case text-amber-300">
            {window ? "window" : "pointers"}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1 bg-[#0b0b16] p-3">
        {chars.map((ch, i) => {
          const here = ptrsAt(i);
          const active = here.length > 0;
          return (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className="flex min-h-4 flex-wrap justify-center gap-0.5">
                {here.map((p) => (
                  <span key={p.name} className="rounded bg-amber-400/20 px-1 py-0.5 font-mono text-[8px] font-bold text-amber-300">
                    {p.name}↓
                  </span>
                ))}
              </div>
              <div
                className={`flex min-w-7 items-center justify-center rounded-md border px-2 py-1.5 font-mono text-[13px] transition-colors ${
                  active
                    ? "border-amber-400 bg-amber-400/10 text-amber-200"
                    : inWindow(i)
                    ? "border-sky-500/40 bg-sky-500/10 text-sky-200"
                    : "border-border/60 bg-muted/40 text-foreground/90"
                }`}
              >
                {ch === " " ? "␣" : ch}
              </div>
              <span className="font-mono text-[9px] text-muted-foreground/60">{i}</span>
            </div>
          );
        })}
        {endPointers.length > 0 && (
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex min-h-4 flex-wrap justify-center gap-0.5">
              {endPointers.map((p) => (
                <span key={p.name} className="rounded bg-amber-400/20 px-1 py-0.5 font-mono text-[8px] font-bold text-amber-300">
                  {p.name}↓
                </span>
              ))}
            </div>
            <div className="min-w-6 px-1 py-1.5 text-center font-mono text-[11px] text-muted-foreground/50">end</div>
            <span className="font-mono text-[9px] text-muted-foreground/60">{chars.length}</span>
          </div>
        )}
      </div>
    </div>
  );
}

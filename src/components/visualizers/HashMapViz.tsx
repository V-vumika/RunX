"use client";

import type { Snapshot, ValueNode } from "@/types/snapshot";
import { shortRepr } from "@/lib/explain/narrate";

export function HashMapViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const snap  = snapshots[step];
  const frame = snap?.stack.at(-1);
  if (!frame) return null;

  const mapVar = frame.locals.find((v) => v.value.kind === "dict" && (v.value.entries?.length ?? 0) > 0);
  if (!mapVar?.value.entries) return null;

  // figure out which key was just touched (if any local var matches a key)
  const keyVar = frame.locals.find((v) => ["key", "k"].includes(v.name));
  const activeKey = keyVar ? String(keyVar.value.value ?? keyVar.value.repr ?? "") : null;

  const entries = mapVar.value.entries.map((e) => ({
    key: shortRepr(e.key, 8),
    rawKey: String(e.key.value ?? e.key.repr ?? ""),
    val: shortRepr(e.value, 10),
  }));

  const count = entries.length;
  const cols = Math.min(2, count);
  const rowH = 28, gap = 6;

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        hashmap · {mapVar.name} · {count} {count === 1 ? "entry" : "entries"}
      </div>
      <div className="bg-[#0d0d1a] p-3">
        <div className={`grid gap-1.5 ${cols === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
          {entries.slice(0, 20).map((e, idx) => {
            const isActive = e.rawKey === activeKey;
            return (
              <div
                key={idx}
                className={`flex items-center gap-2 rounded border px-2.5 py-1.5 transition-all duration-150 ${
                  isActive
                    ? "border-amber-500/50 bg-amber-500/10"
                    : "border-[#2a2a4a] bg-[#12122a]"
                }`}
              >
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                    isActive ? "bg-amber-500/20 text-amber-300" : "bg-[#1e1e35] text-violet-300"
                  }`}
                >
                  {e.key}
                </span>
                <span className="text-muted-foreground/40">→</span>
                <span className={`font-mono text-[11px] truncate ${isActive ? "text-amber-200" : "text-emerald-300/90"}`}>
                  {e.val}
                </span>
              </div>
            );
          })}
        </div>
        {entries.length > 20 && (
          <div className="mt-1.5 text-center text-[10px] text-muted-foreground/50">
            + {entries.length - 20} more
          </div>
        )}
      </div>
      {keyVar && (
        <div className="flex items-center gap-2 border-t border-border/40 px-3 py-1.5 text-[10px] text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          accessing key <span className="font-mono text-amber-300">{shortRepr(keyVar.value, 10)}</span>
        </div>
      )}
    </div>
  );
}

"use client";

import type { Snapshot } from "@/types/snapshot";
import { shortRepr } from "@/lib/explain/narrate";

export function HashMapViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const isPlaying = useExecutionStore((s) => s.isPlaying);
  const stepForward = useExecutionStore((s) => s.stepForward);
  const stepBackward = useExecutionStore((s) => s.stepBackward);
  const goToStep = useExecutionStore((s) => s.goToStep);
  const togglePlay = useExecutionStore((s) => s.togglePlay);
  const pause = useExecutionStore((s) => s.pause);

  const snap = snapshots[step];
  const found = findMap(snap?.stack);
  if (!found) return null;
  const { mapVar } = found;
  const frame = snap?.stack.at(-1);

  const currNode = mapVar.value;
  const prevNode = dictByName(snapshots[step - 1], mapVar.name);
  const currMap = entryMap(currNode);
  const prevMap = entryMap(prevNode);

  const size = currNode.entries?.length ?? 0;

  // stable capacity: sized off the largest the map ever gets (so deletes don't reflow it)
  let maxSize = size;
  for (let s = 0; s <= step; s++) {
    const n = dictByName(snapshots[s], mapVar.name);
    maxSize = Math.max(maxSize, n?.entries?.length ?? 0);
  }
  const cap = nextPow2(Math.max(8, Math.ceil(maxSize / 0.75)));

  // which key was touched this step
  const inserted = [...currMap.keys()].filter((k) => !prevMap.has(k));
  const updated = [...currMap.keys()].filter((k) => prevMap.has(k) && prevMap.get(k) !== currMap.get(k));
  const deleted = [...prevMap.keys()].filter((k) => !currMap.has(k));
  const keyVar = frame?.locals.find((v) => ["key", "k"].includes(v.name));
  const activeRepr = keyVar?.value.repr ?? null;
  const touched = inserted[0] ?? updated[0] ?? deleted[0] ?? activeRepr ?? null;

  // build nodes → buckets
  const buckets: HNode[][] = Array.from({ length: cap }, () => []);
  for (const e of currNode.entries ?? []) {
    const { hash, isStr, raw } = hashKey(e.key);
    const index = idxOf(hash, cap);
    const state: NodeState = inserted.includes(e.key.repr)
      ? "inserted"
      : updated.includes(e.key.repr)
      ? "updated"
      : "filled";
    buckets[index].push({
      key: shortRepr(e.key, 8), val: shortRepr(e.value, 10),
      index, hash, isStr, raw, state, current: e.key.repr === touched,
    });
  }
  // deleted key: show a ghost node in its bucket for this step
  let deletedNode: HNode | null = null;
  if (deleted.length && prevNode) {
    const de = prevNode.entries?.find((e) => e.key.repr === deleted[0]);
    if (de) {
      const { hash, isStr, raw } = hashKey(de.key);
      const index = idxOf(hash, cap);
      deletedNode = {
        key: shortRepr(de.key, 8), val: shortRepr(de.value, 10),
        index, hash, isStr, raw, state: "deleted", current: true,
      };
      buckets[index].push(deletedNode);
    }
  }

  const loadFactor = (size / cap).toFixed(2);
  const bucketW = 78;

  // hash-calculation focus node
  const focus =
    buckets.flat().find((n) => n.current) ?? deletedNode ?? null;

  // short display form of a key given its repr, looked up in either dict node
  const keyDisplay = (repr: string): string => {
    const e = currNode.entries?.find((x) => x.key.repr === repr)
      ?? prevNode?.entries?.find((x) => x.key.repr === repr);
    return e ? shortRepr(e.key, 8) : repr;
  };

  const opLabel = deleted.length
    ? `remove(${keyDisplay(deleted[0])})`
    : updated.length
    ? `update(${keyDisplay(updated[0])})`
    : inserted.length
    ? `put(${keyDisplay(inserted[0])})`
    : activeRepr
    ? `get(${shortRepr(keyVar!.value, 8)})`
    : "—";

  const controls = (
    <div className="flex items-center justify-center gap-2.5">
      <ControlButton onClick={() => { pause(); goToStep(0); }} disabled={step <= 0} label="First">
        <ChevronFirst className="size-4" />
      </ControlButton>
      <ControlButton onClick={stepBackward} disabled={step <= 0} label="Previous">
        <SkipBack className="size-4" />
      </ControlButton>
      <ControlButton onClick={togglePlay} primary label={isPlaying ? "Pause" : "Play"}>
        {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 translate-x-px" />}
      </ControlButton>
      <ControlButton onClick={stepForward} disabled={step >= snapshots.length - 1} label="Next">
        <SkipForward className="size-4" />
      </ControlButton>
      <ControlButton onClick={() => { pause(); goToStep(snapshots.length - 1); }} disabled={step >= snapshots.length - 1} label="Last">
        <ChevronLast className="size-4" />
      </ControlButton>
      <span className="ml-1.5 font-mono text-[11px] tabular-nums text-muted-foreground/60">
        {step + 1} <span className="opacity-40">/ {snapshots.length}</span>
      </span>
    </div>
  );

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-white/5 via-white/2 to-transparent backdrop-blur-xl">
      <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-10 h-52 w-52 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* header */}
      <div className="relative flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-lg bg-violet-500/20 font-mono text-[11px] text-violet-300">{"{}"}</span>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-foreground/80">HashMap</span>
          <span className="font-mono text-[11px] text-muted-foreground/70">{mapVar.name}</span>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground/60">
          {opLabel}
        </span>
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
            ))}
          </div>
        </div>

        {/* memory view (2D) + hash calc */}
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/20 p-3.5">
            <div className="mb-2.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              memory view (2D)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-separate" style={{ borderSpacing: 4 }}>
                <tbody className="font-mono text-[10px]">
                  {([
                    ["Index",   (b: number) => <span className="text-violet-300">{b}</span>],
                    ["Key",     (b: number) => cellText(buckets[b], (n) => n.key)],
                    ["Value",   (b: number) => cellText(buckets[b], (n) => n.val)],
                    ["Hash",    (b: number) => cellText(buckets[b], (n) => String(n.hash))],
                    ["h % cap", (b: number) => cellText(buckets[b], (n) => String(n.index))],
                  ] as const).map(([label, render]) => (
                    <tr key={label}>
                      <td className="whitespace-nowrap pr-2 text-right text-[9px] uppercase tracking-wider text-muted-foreground/50">{label}</td>
                      {buckets.map((chain, b) => {
                        const occupied = chain.length > 0;
                        const cur = chain.some((n) => n.current);
                        return (
                          <td key={b}
                            className="rounded-md border px-1.5 py-1 text-center"
                            style={{
                              borderColor: cur ? AMBER : occupied ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.05)",
                              background: cur ? "rgba(245,185,66,0.08)" : occupied ? "rgba(16,185,129,0.05)" : "transparent",
                              color: occupied ? "#c7d2d0" : "rgba(255,255,255,0.2)",
                            }}
                          >
                            {render(b)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* hash calculation */}
          <div className="shrink-0 lg:w-64">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3.5">
              <div className="mb-2.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F5B942]" />
                hash calculation
              </div>
              {focus ? (
                <div className="space-y-2 font-mono text-[11px]">
                  <div className="text-muted-foreground">
                    key <span className="text-[#FDE7BE]">{focus.key}</span>
                  </div>
                  {focus.isStr ? (
                    <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/30 p-2 text-[10px] leading-relaxed text-emerald-300/80">
{`h = 0
for c in "${focus.raw}":
    h = 31*h + ord(c)`}
                    </pre>
                  ) : (
                    <div className="text-muted-foreground">integer key hashes to itself</div>
                  )}
                  <div className="text-blue-300/90">hash = {focus.hash}</div>
                  <div className="rounded-lg border border-[#F5B942]/20 bg-[#F5B942]/10 px-2.5 py-2 text-[#FDE7BE]">
                    index = {focus.hash} % {cap} = <span className="font-bold">{focus.index}</span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] leading-relaxed text-muted-foreground/70">
                  Step to an insert, update or lookup to see how its bucket index is computed.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* controls */}
      <div className="relative border-t border-white/10 px-4 py-3.5">{controls}</div>
    </div>
  );
}

/** Render the head node's field for a bucket cell, with a +n chain badge. */
function cellText(chain: HNode[], pick: (n: HNode) => string): ReactNode {
  if (chain.length === 0) return "∅";
  const extra = chain.length - 1;
  return (
    <span className="inline-flex items-center gap-1">
      {pick(chain[0])}
      {extra > 0 && <span className="rounded bg-white/10 px-1 text-[8px] text-white/50">+{extra}</span>}
    </span>
  );
}

"use client";

import { Fragment, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronFirst,
  ChevronLast,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from "lucide-react";

import type { Snapshot, StackFrame, ValueNode } from "@/types/snapshot";
import { shortRepr } from "@/lib/explain/narrate";
import { useExecutionStore } from "@/lib/store/execution-store";

// ── hashing ────────────────────────────────────────────────────────────────────

/** Java-style String.hashCode() — 32-bit, h = 31·h + c. Matches the panel code. */
function javaHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

/** Hash a key node: ints hash to themselves, everything else via its string form. */
function hashKey(node: ValueNode): { hash: number; isStr: boolean; raw: string } {
  if (node.kind === "int") {
    const n = Number(node.value);
    return { hash: n | 0, isStr: false, raw: String(n) };
  }
  const raw = node.kind === "str" ? String(node.value ?? "") : node.repr;
  return { hash: javaHash(raw), isStr: true, raw };
}

const idxOf = (hash: number, cap: number) => ((hash % cap) + cap) % cap;
const nextPow2 = (n: number) => (n <= 8 ? 8 : 1 << Math.ceil(Math.log2(n)));

// ── data extraction ────────────────────────────────────────────────────────────

/** Innermost frame's largest dict variable (the hashmap). */
function findMap(stack: StackFrame[] | undefined): { mapVar: { name: string; value: ValueNode } } | null {
  if (!stack) return null;
  for (let k = stack.length - 1; k >= 0; k--) {
    const dicts = stack[k].locals.filter((l) => l.value.kind === "dict" && !l.name.startsWith("__"));
    if (dicts.length) {
      dicts.sort((a, b) => (b.value.entries?.length ?? 0) - (a.value.entries?.length ?? 0));
      return { mapVar: dicts[0] };
    }
  }
  return null;
}

/** Map of keyRepr → value repr for a dict node. */
function entryMap(node: ValueNode | undefined): Map<string, string> {
  const m = new Map<string, string>();
  for (const e of node?.entries ?? []) m.set(e.key.repr, shortRepr(e.value, 12));
  return m;
}

function dictByName(snap: Snapshot | undefined, name: string): ValueNode | undefined {
  return snap?.stack.find((f) => f.locals.some((l) => l.name === name))
    ?.locals.find((l) => l.name === name)?.value;
}

// ── visual states ──────────────────────────────────────────────────────────────

type NodeState = "inserted" | "updated" | "filled" | "deleted";

const STATE: Record<NodeState, { bg: string; border: string; text: string; dot: string }> = {
  inserted: { bg: "rgba(16,185,129,0.16)",  border: "#34D399", text: "#A7F3D0", dot: "#34D399" },
  updated:  { bg: "rgba(59,130,246,0.16)",  border: "#60A5FA", text: "#BFDBFE", dot: "#60A5FA" },
  filled:   { bg: "rgba(16,185,129,0.07)",  border: "rgba(52,211,153,0.35)", text: "#8FE7C0", dot: "#2F6B4F" },
  deleted:  { bg: "rgba(244,63,94,0.14)",   border: "#FB7185", text: "#FDA4AF", dot: "#FB7185" },
};

const AMBER = "#F5B942";

interface HNode {
  key: string;
  val: string;
  index: number;
  hash: number;
  isStr: boolean;
  raw: string;
  state: NodeState;
  current: boolean;
}

// ── small pieces ───────────────────────────────────────────────────────────────

function StatTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/3 px-3.5 py-2.5 backdrop-blur">
      <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">{label}</div>
      <div className="mt-1 font-mono text-sm text-foreground/90">{children}</div>
    </div>
  );
}

function LegendDot({ color, label, ring }: { color: string; label: string; ring?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
      <span
        className="h-2.5 w-2.5 rounded-lg"
        style={ring ? { boxShadow: `0 0 0 2px ${color}`, background: "transparent" } : { background: color }}
      />
      {label}
    </span>
  );
}

function NodeCard({ node }: { node: HNode }) {
  const s = STATE[node.state];
  const deleted = node.state === "deleted";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.6, y: -8 }}
      animate={{
        opacity: deleted ? 0.55 : 1,
        scale: 1,
        y: 0,
        backgroundColor: s.bg,
        borderColor: node.current ? AMBER : s.border,
        boxShadow: node.current
          ? `0 0 0 2px ${AMBER}66, 0 8px 22px -6px ${AMBER}88`
          : "0 3px 10px -4px rgba(0,0,0,0.6)",
      }}
      exit={{ opacity: 0, scale: 0.6, y: 8 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="relative w-full overflow-hidden rounded-xl border px-2.5 py-1.5"
      style={{ borderWidth: 1.5 }}
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-xl"
        style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.07), transparent)" }}
      />
      <div className="relative flex flex-col items-center leading-tight">
        <span
          className={`font-mono text-[12px] font-semibold ${deleted ? "line-through" : ""}`}
          style={{ color: node.current ? "#FDE7BE" : s.text }}
        >
          {node.key}
        </span>
        <span className="font-mono text-[11px]" style={{ color: node.current ? "#FCD9A0" : s.text, opacity: 0.85 }}>
          {node.val}
        </span>
      </div>
    </motion.div>
  );
}

function ControlButton({ onClick, disabled, label, primary, children }: {
  onClick: () => void; disabled?: boolean; label: string; primary?: boolean; children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`flex items-center justify-center rounded-xl border backdrop-blur transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 ${
        primary
          ? "size-10 border-primary/40 bg-primary/20 text-primary shadow-lg shadow-primary/20 hover:bg-primary/30"
          : "size-9 border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// ── main component ─────────────────────────────────────────────────────────────

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

      <div className="relative flex flex-col gap-4 p-4">
        {/* stats + legend */}
        <div className="flex flex-wrap items-stretch gap-2.5">
          <StatTile label="Load Factor">
            <div className="flex items-center gap-2">
              <span>{size} / {cap} = {loadFactor}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-28 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-linear-to-r from-emerald-400 to-amber-400"
                animate={{ width: `${Math.min(100, (size / cap) * 100)}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 26 }}
              />
            </div>
          </StatTile>
          <StatTile label="Size">{size}</StatTile>
          <StatTile label="Capacity">{cap}</StatTile>
          <div className="flex flex-1 flex-wrap content-center items-center gap-x-3.5 gap-y-1.5 rounded-2xl border border-white/10 bg-white/3 px-3.5 py-2.5 backdrop-blur">
            <LegendDot color={STATE.inserted.dot} label="Inserted" />
            <LegendDot color={STATE.updated.dot} label="Updated" />
            <LegendDot color={STATE.deleted.dot} label="Deleted" />
            <LegendDot color={AMBER} label="Current" ring />
            <LegendDot color="rgba(255,255,255,0.15)" label="Empty" />
          </div>
        </div>

        {/* buckets */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3.5">
          <div className="mb-2.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            hash table · buckets
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {buckets.map((chain, b) => (
              <div key={b} className="flex shrink-0 flex-col items-center gap-1.5" style={{ width: bucketW }}>
                <span className={`font-mono text-[11px] ${b === focus?.index ? "font-bold text-[#F5B942]" : "text-muted-foreground/50"}`}>{b}</span>
                <div className="flex min-h-15.5 w-full flex-col items-center gap-1 rounded-xl border border-white/6 bg-white/1.5 p-1.5">
                  <AnimatePresence mode="popLayout">
                    {chain.length === 0 ? (
                      <motion.span
                        key="empty"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex h-11.5 items-center justify-center font-mono text-sm text-white/15"
                      >
                        ∅
                      </motion.span>
                    ) : (
                      chain.map((n, ni) => (
                        <Fragment key={`${n.key}-${n.state}`}>
                          {ni > 0 && (
                            <motion.span
                              initial={{ opacity: 0 }} animate={{ opacity: 0.5 }}
                              className="text-[10px] leading-none text-white/30"
                            >
                              ↓
                            </motion.span>
                          )}
                          <NodeCard node={n} />
                        </Fragment>
                      ))
                    )}
                  </AnimatePresence>
                </div>
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

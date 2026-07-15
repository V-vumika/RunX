"use client";

import type { Snapshot, ValueNode, Variable } from "@/types/snapshot";
import { shortRepr } from "@/lib/explain/narrate";

// Which attribute holds a node's payload / its link to the next node.
const VAL_ATTRS = ["val", "value", "data", "key"];
// Named pointers we highlight on the chain, with a stable colour each.
const POINTERS: { names: string[]; label: string; color: string; bg: string }[] = [
  { names: ["head"],                 label: "head", color: "#EF9F27", bg: "#3D2A00" },
  { names: ["dummy"],                label: "dummy", color: "#A78BFA", bg: "#231A4A" },
  { names: ["prev"],                 label: "prev", color: "#93C5FD", bg: "#0C2040" },
  { names: ["curr", "current", "node", "ptr", "p", "cur"], label: "curr", color: "#C4C0F5", bg: "#2D2A5A" },
  { names: ["nxt", "next_node"],     label: "next", color: "#6EE7B7", bg: "#0A3028" },
  { names: ["slow"],                 label: "slow", color: "#FCA5A5", bg: "#3D1010" },
  { names: ["fast"],                 label: "fast", color: "#FCD34D", bg: "#3D2A00" },
  { names: ["tail"],                 label: "tail", color: "#F0ABFC", bg: "#3A0A3A" },
];

function getAttr(node: ValueNode | undefined, names: string[]): ValueNode | undefined {
  if (!node || node.kind !== "object") return undefined;
  for (const n of names) {
    const a = node.attributes?.find((x) => x.name === n);
    if (a) return a.value;
  }
  return undefined;
}

function nodeValue(node: ValueNode | undefined): string {
  const v = getAttr(node, VAL_ATTRS);
  return v ? shortRepr(v, 6) : "?";
}

interface Chain {
  nodes: { id?: number; val: string }[];
  /** How the chain ends: a null terminator, a cycle, or truncated by trace depth. */
  end: "null" | "cycle" | "more";
}

/** Walk a linked list from `head`, following `.next`, into a flat node array. */
function walkChain(head: ValueNode | undefined): Chain {
  const nodes: { id?: number; val: string }[] = [];
  const seen = new Set<number>();
  let cur = head;

  for (let i = 0; i < 25; i++) {
    if (!cur || cur.kind === "none") return { nodes, end: "null" };
    if (cur.kind === "circular") return { nodes, end: "cycle" };
    if (cur.kind !== "object") return { nodes, end: "null" };
    if (cur.id != null) {
      if (seen.has(cur.id)) return { nodes, end: "cycle" };
      seen.add(cur.id);
    }

    nodes.push({ id: cur.id, val: nodeValue(cur) });

    // Attributes absent → the serializer truncated by depth; we can't go deeper.
    if (!cur.attributes) return { nodes, end: "more" };
    const nextEntry = cur.attributes.find((a) => a.name === "next");
    if (!nextEntry) return { nodes, end: "null" };
    cur = nextEntry.value;
  }
  return { nodes, end: "more" };
}

/** Pick the best node to treat as the list head, plus every named pointer's target id. */
function collectPointers(locals: Variable[]) {
  const byName = new Map(locals.map((v) => [v.name, v.value]));

  // Pointer name → the id (or null) it currently references.
  const refs: { label: string; color: string; bg: string; id: number | null }[] = [];
  for (const p of POINTERS) {
    const v = p.names.map((n) => byName.get(n)).find(Boolean);
    if (!v) continue;
    refs.push({ label: p.label, color: p.color, bg: p.bg, id: v.kind === "none" ? null : v.id ?? null });
  }

  // Head candidate, in priority order:
  //  1. an explicit head/dummy local, or self.head inside a method
  //  2. a `head` attribute on any wrapper object (e.g. `ll` for a LinkedList
  //     class) — this is the module-level case, where the list lives in ll.head
  //  3. any object that itself has a `.next` (a bare node passed around)
  let head =
    byName.get("head") ??
    byName.get("dummy") ??
    getAttr(byName.get("self"), ["head"]);

  if (!head || head.kind !== "object") {
    for (const v of locals) {
      const h = getAttr(v.value, ["head"]);
      if (h && h.kind === "object") { head = h; break; }
    }
  }
  if (!head || head.kind !== "object") {
    const anyNode = locals.find(
      (v) => v.value.kind === "object" && v.value.attributes?.some((a) => a.name === "next")
    );
    if (anyNode) head = anyNode.value;
  }
  return { head, refs };
}

export function LinkedListViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const snap = snapshots[step];
  const frame = snap?.stack.at(-1);
  if (!frame) return null;

  const { head, refs } = collectPointers(frame.locals);
  const { nodes, end } = walkChain(head);

  // Pointers that reference null (e.g. prev = None) render on the null terminator.
  const nullRefs = refs.filter((r) => r.id === null);
  const refsFor = (id?: number) => (id == null ? [] : refs.filter((r) => r.id === id));

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        linked list {nodes.length > 0 && <span className="text-muted-foreground/50">· {nodes.length} node{nodes.length > 1 ? "s" : ""}</span>}
      </div>

      <div className="flex items-start gap-0 overflow-x-auto bg-[#0b0b16] px-4 py-5">
        {/* head entry pointer */}
        <div className="mr-1 flex flex-col items-center gap-1 pt-4.5">
          <span className="rounded bg-[#3D2A00] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#EF9F27]">head</span>
          <span className="text-base text-[#EF9F27]/70">→</span>
        </div>

        {nodes.length === 0 ? (
          <div className="flex flex-col items-center gap-1 pt-4.5">
            <span className="rounded-md border border-dashed border-[#2a2a3a] px-3 py-2 font-mono text-[11px] text-muted-foreground/50">null</span>
            <span className="text-[9px] text-muted-foreground/50">empty list</span>
          </div>
        ) : (
          <>
            {nodes.map((n, i) => {
              const here = refsFor(n.id);
              const isCurr = here.some((r) => r.label === "curr" || r.label === "slow" || r.label === "fast");
              return (
                <div key={i} className="flex shrink-0 items-start">
                  <div className="flex flex-col items-center gap-1">
                    {/* pointer tags above the node */}
                    <div className="flex min-h-4 flex-wrap justify-center gap-0.5">
                      {here.map((r) => (
                        <span
                          key={r.label}
                          className="rounded px-1 py-0.5 font-mono text-[8px] font-bold"
                          style={{ color: r.color, background: r.bg }}
                        >
                          {r.label}
                        </span>
                      ))}
                    </div>
                    {/* node box: [ data | next ] */}
                    <div
                      className="flex items-stretch overflow-hidden rounded-md border font-mono transition-shadow"
                      style={{
                        borderColor: isCurr ? "#9B96E8" : "#33335a",
                        boxShadow: isCurr ? "0 0 0 2px rgba(155,150,232,.35)" : undefined,
                      }}
                    >
                      <span className="min-w-9 px-3 py-2 text-center text-sm font-bold text-foreground/90">{n.val}</span>
                      <span className="flex items-center border-l border-[#2a2a4a] bg-[#171730] px-1.5 text-[8px] uppercase tracking-wide text-muted-foreground/50">
                        next
                      </span>
                    </div>
                    {/* index caption */}
                    <span className="font-mono text-[9px] text-muted-foreground/35">{i}</span>
                  </div>
                  {/* arrow to next node */}
                  {i < nodes.length - 1 && (
                    <span className="px-1 pt-6.5 text-base text-[#4a4a6a]">→</span>
                  )}
                </div>
              );
            })}

            {/* terminator */}
            <span className="px-1 pt-6.5 text-base text-[#4a4a6a]">→</span>
            <div className="flex flex-col items-center gap-1">
              <div className="flex min-h-4 flex-wrap justify-center gap-0.5">
                {nullRefs.map((r) => (
                  <span key={r.label} className="rounded px-1 py-0.5 font-mono text-[8px] font-bold" style={{ color: r.color, background: r.bg }}>
                    {r.label}
                  </span>
                ))}
              </div>
              <span
                className="rounded-md border border-dashed px-3 py-2 font-mono text-[11px]"
                style={{
                  borderColor: end === "cycle" ? "#DC2626" : "#2a2a3a",
                  color: end === "cycle" ? "#FCA5A5" : "#454568",
                }}
              >
                {end === "cycle" ? "⟳ cycle" : end === "more" ? "…" : "null"}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="border-t border-border/40 px-3 py-1 text-[10px] text-muted-foreground">
        stack depth <span className="font-mono text-foreground/50">{snap.stack.length}</span>
        {snap.event === "return" && snap.returnValue && (
          <> · returns <span className="font-mono text-emerald-400">{shortRepr(snap.returnValue, 14)}</span></>
        )}
        {end === "more" && <> · <span className="text-muted-foreground/50">list continues beyond trace depth</span></>}
      </div>
    </div>
  );
}

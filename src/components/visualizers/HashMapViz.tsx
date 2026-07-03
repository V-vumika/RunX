"use client";

import type { Snapshot, StackFrame, Variable } from "@/types/snapshot";
import { shortRepr } from "@/lib/explain/narrate";

const CAP = 8;

function simpleHash(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (Math.imul(31, h) + key.charCodeAt(i)) >>> 0;
  }
  return h % CAP;
}

interface Entry { key: string; val: string }

/** Strip surrounding quotes so a key's var value and its dict-entry form match. */
function rawKeyOf(node: { value?: unknown; repr?: string }): string {
  return String(node.value ?? node.repr ?? "").replace(/^['"]|['"]$/g, "");
}

// ── small pieces ───────────────────────────────────────────────────────────────

function ArrowDown() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: 2, height: 10, background: "#1e1e35" }} />
      <div style={{ width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: "5px solid #1e1e35" }} />
    </div>
  );
}

function NodeCell({ node, active, head }: { node: Entry; active: boolean; head?: boolean }) {
  return (
    <div style={{
      width: 64, height: head ? 60 : 34, borderRadius: 6,
      border: `1.5px solid ${active ? "#EF9F27" : "#1D9E75"}`,
      background: active ? "#3D2A00" : "#0F3D2E",
      boxShadow: active ? "0 0 10px #EF9F2744" : "none",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
    }}>
      <span style={{
        fontSize: 10, fontWeight: 600,
        color: active ? "#EF9F27" : "#93E7C5",
        maxWidth: 58, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {node.key}
      </span>
      {head && <div style={{ width: 40, height: 1, background: "#ffffff", opacity: 0.15 }} />}
      <span style={{ fontSize: head ? 12 : 11, fontWeight: 700, color: active ? "#FCD34D" : "#6EE7B7" }}>
        {node.val}
      </span>
    </div>
  );
}

export function HashMapViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const snap  = snapshots[step];
  const stack = snap?.stack;
  if (!stack || stack.length === 0) return null;

  // Bug 2 fix: search every frame (innermost first) and pick the *largest* real
  // dict — not just the first local, which may be empty, unrelated, or in another
  // frame than the one being executed.
  let mapFrame: StackFrame | null = null;
  let mapVar: Variable | null = null;
  for (let f = stack.length - 1; f >= 0; f--) {
    const dicts = stack[f].locals.filter(
      (v) => v.value.kind === "dict" && !v.name.startsWith("__")
    );
    if (dicts.length) {
      mapFrame = stack[f];
      mapVar = dicts.reduce((a, b) =>
        (b.value.entries?.length ?? 0) > (a.value.entries?.length ?? 0) ? b : a
      );
      break;
    }
  }
  if (!mapVar || !mapFrame) return null;

  const entries = mapVar.value.entries ?? [];

  // Bug 1 fix: chain collisions — keep *every* key that hashes to a bucket,
  // not just the first one.
  const buckets: Entry[][] = Array.from({ length: CAP }, () => []);
  const keySet = new Set<string>();
  entries.forEach((e) => {
    const rawKey = rawKeyOf(e.key);
    keySet.add(rawKey);
    buckets[simpleHash(rawKey)].push({ key: rawKey, val: shortRepr(e.value, 8) });
  });

  // Bug 3 fix: only treat a `key`/`k` local as the "current" access when its
  // value is actually a key in this map — otherwise a loop counter named `k`
  // lights up a random bucket.
  const keyVar    = mapFrame.locals.find((v) => ["key", "k"].includes(v.name));
  const rawActive = keyVar ? rawKeyOf(keyVar.value) : null;
  const activeKey = rawActive !== null && keySet.has(rawActive) ? rawActive : null;
  const activeIdx = activeKey !== null ? simpleHash(activeKey) : -1;

  const size       = entries.length;
  const lf         = (size / CAP).toFixed(2);
  const lfPercent  = Math.min(100, parseFloat(lf) * 100);

  return (
    <div style={{ background: "#0d0d18", borderRadius: 10, overflow: "hidden", fontFamily: "var(--font-mono)" }}>

      {/* topbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid #1e1e35" }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: "#666688", letterSpacing: ".06em", textTransform: "uppercase" }}>
          hash table (buckets) · {mapVar.name}
        </span>
        <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#555577" }}>
          <span>size <span style={{ fontWeight: 600, color: "#1D9E75" }}>{size}</span></span>
          <span>capacity <span style={{ fontWeight: 600, color: "#9B96E8" }}>{CAP}</span></span>
          <span>load <span style={{ fontWeight: 600, color: "#EF9F27" }}>{lf}</span></span>
        </div>
      </div>

      {/* load factor bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px 4px" }}>
        <span style={{ fontSize: 10, color: "#555577" }}>load</span>
        <div style={{ flex: 1, height: 4, background: "#1e1e35", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: 4, width: `${lfPercent}%`, background: "linear-gradient(90deg,#1D9E75,#EF9F27)", borderRadius: 2 }} />
        </div>
        <span style={{ fontSize: 10, color: "#EF9F27" }}>{size}/{CAP}</span>
      </div>

      {/* buckets */}
      <div style={{ display: "flex", gap: 10, padding: "12px 16px 8px", overflowX: "auto", alignItems: "flex-start" }}>
        {buckets.map((chain, i) => {
          const isActive    = i === activeIdx;
          const filled      = chain.length > 0;
          const head        = chain[0];
          const dotColor    = isActive ? "#EF9F27" : filled ? "#1D9E75" : "#1e1e35";
          const idxColor    = isActive ? "#EF9F27" : filled ? "#1D9E75" : "#333355";

          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 64 }}>
              {/* index */}
              <span style={{ fontSize: 11, fontWeight: 600, color: idxColor, marginBottom: 6 }}>{i}</span>

              {/* top dot */}
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                border: `2px solid ${dotColor}`,
                background: filled ? dotColor : "transparent",
              }} />
              <div style={{ width: 2, height: 6, background: dotColor, opacity: 0.5 }} />

              {/* head cell */}
              {filled ? (
                <NodeCell node={head} active={head.key === activeKey} head />
              ) : (
                <div style={{
                  width: 64, height: 60, borderRadius: 6,
                  border: "1.5px solid #222240", background: "#0d0d18",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 22, color: "#1e1e35" }}>∅</span>
                </div>
              )}

              {/* collision chain */}
              {chain.slice(1).map((node, k) => (
                <div key={k} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <ArrowDown />
                  <NodeCell node={node} active={node.key === activeKey} />
                </div>
              ))}

              {/* null terminator */}
              <ArrowDown />
              <div style={{
                width: 64, height: 28, borderRadius: 5,
                border: "1px solid #1e1e35", background: "#0a0a15",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 10, color: "#222240" }}>∅</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* active key info */}
      {activeKey && (
        <div style={{ padding: "4px 16px 6px", fontSize: 10, color: "#EF9F27", minHeight: 18 }}>
          hash(&quot;{activeKey}&quot;) → bucket [{activeIdx}]
        </div>
      )}

      {/* legend */}
      <div style={{ display: "flex", gap: 14, padding: "6px 16px 10px", flexWrap: "wrap" }}>
        {[
          { color: "#1D9E75", label: "inserted" },
          { color: "#EF9F27", label: "current" },
          { color: "#1e1e35", label: "empty" },
        ].map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#555577" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

    </div>
  );
}

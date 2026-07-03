"use client";

import type { Snapshot, ValueNode } from "@/types/snapshot";
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

export function HashMapViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const snap  = snapshots[step];
  const frame = snap?.stack.at(-1);
  if (!frame) return null;

  const mapVar = frame.locals.find(
    (v) => v.value.kind === "dict"
  );
  if (!mapVar) return null;

  const entries = mapVar.value.entries ?? [];

  // active key being accessed
  const keyVar    = frame.locals.find((v) => ["key", "k"].includes(v.name));
  const activeKey = keyVar
    ? String(keyVar.value.value ?? keyVar.value.repr ?? "").replace(/^['"]|['"]$/g, "")
    : null;
  const activeIdx = activeKey !== null ? simpleHash(activeKey) : -1;

  // build buckets
  const buckets: (Entry | null)[] = Array(CAP).fill(null);
  entries.forEach((e) => {
    const rawKey = String(e.key.value ?? e.key.repr ?? "").replace(/^['"]|['"]$/g, "");
    const idx    = simpleHash(rawKey) % CAP;
    if (!buckets[idx]) {
      buckets[idx] = { key: rawKey, val: shortRepr(e.value, 8) };
    }
  });

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
      <div style={{ display: "flex", gap: 10, padding: "12px 16px 8px", overflowX: "auto" }}>
        {buckets.map((entry, i) => {
          const isActive    = i === activeIdx;
          const filled      = entry !== null;
          const dotColor    = isActive ? "#EF9F27" : filled ? "#1D9E75" : "#1e1e35";
          const borderColor = isActive ? "#EF9F27" : filled ? "#1D9E75" : "#222240";
          const bgColor     = isActive ? "#3D2A00" : filled ? "#0F3D2E" : "#0d0d18";
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

              {/* main cell */}
              <div style={{
                width: 64, height: 60, borderRadius: 6,
                border: `1.5px solid ${borderColor}`,
                background: bgColor,
                boxShadow: isActive ? `0 0 10px ${borderColor}44` : "none",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 2,
              }}>
                {filled ? (
                  <>
                    <span style={{
                      fontSize: 10, fontWeight: 600,
                      color: isActive ? "#EF9F27" : "#93E7C5",
                      maxWidth: 58, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {entry.key}
                    </span>
                    <div style={{ width: 40, height: 1, background: "currentColor", opacity: 0.2 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? "#FCD34D" : "#6EE7B7" }}>
                      {entry.val}
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: 22, color: "#1e1e35" }}>∅</span>
                )}
              </div>

              {/* arrow down */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 2, height: 12, background: "#1e1e35" }} />
                <div style={{ width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: "5px solid #1e1e35" }} />
              </div>

              {/* null chaining slot */}
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
          hash("{activeKey}") = {activeIdx} → bucket [{activeIdx}]
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

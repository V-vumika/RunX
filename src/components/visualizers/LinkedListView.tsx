"use client";

/**
 * LinkedListView — visualizes a dict/object chain with a "next" pointer.
 *
 * 🟣 Vumi: this is YOUR component to build out.
 *
 * Props: same as ArrayView — `node`, `name`, `diffState`.
 *
 * What to draw:
 *   A horizontal chain of node-boxes connected by arrows:
 *     [ val: 1 | next → ] ──→ [ val: 2 | next → ] ──→ [ val: 3 | next: None ]
 *   The chain is built by following the "next" key/attribute recursively.
 *   Cap at MAX_NODES (5–10) to avoid overflow on long lists.
 *   If the chain is cut short, show a "…" at the end.
 *   Color the ring using `diffRingClass(diffState)`.
 *
 * Helper — `extractChain(node)` is provided below. It returns the flattened
 * array of ValueNodes in chain order so you don't need to do the recursion.
 */

import type { ValueNode } from "@/types/snapshot";
import type { ChangeState } from "@/lib/visualizers/step-diff";
import { diffRingClass } from "@/lib/visualizers/step-diff";
import { ValueView } from "@/components/inspector/ValueView";

interface Props {
  name: string;
  node: ValueNode;
  diffState?: ChangeState | "unknown";
}

const MAX_NODES = 8;

/** Follows "next" pointers and returns the chain as a flat array. */
function extractChain(node: ValueNode): ValueNode[] {
  const chain: ValueNode[] = [];
  let current: ValueNode | null = node;
  const seen = new Set<number>();

  while (current && chain.length < MAX_NODES) {
    if (current.id != null) {
      if (seen.has(current.id)) break; // cycle guard
      seen.add(current.id);
    }

    chain.push(current);

    // Follow "next" from dict entries.
    if (current.kind === "dict") {
      type DictEntry = { key: ValueNode; value: ValueNode };
      const nextEntry: DictEntry | undefined = current.entries?.find(
        (e) => e.key.kind === "str" && e.key.repr === "'next'"
      );
      const nextVal: ValueNode | undefined = nextEntry?.value;
      current = nextVal?.kind === "none" ? null : (nextVal ?? null);
      continue;
    }

    // Follow "next" from object attributes.
    if (current.kind === "object") {
      const nextAttr: { name: string; value: ValueNode } | undefined =
        current.attributes?.find((a) => a.name === "next");
      const nextVal: ValueNode | undefined = nextAttr?.value;
      current = nextVal?.kind === "none" ? null : (nextVal ?? null);
      continue;
    }

    break;
  }

  return chain;
}

/** Returns the "data" value of a linked-list node (everything except "next"). */
function nodeDataEntries(node: ValueNode): { label: string; val: ValueNode }[] {
  if (node.kind === "dict") {
    return (node.entries ?? [])
      .filter((e) => e.key.repr !== "'next'")
      .map((e) => ({ label: e.key.repr.replace(/'/g, ""), val: e.value }));
  }
  if (node.kind === "object") {
    return (node.attributes ?? [])
      .filter((a) => a.name !== "next")
      .map((a) => ({ label: a.name, val: a.value }));
  }
  return [{ label: "value", val: node }];
}

export function LinkedListView({ name, node, diffState = "unknown" }: Props) {
  const chain = extractChain(node);
  const truncated = chain.length >= MAX_NODES;
  const ring = diffRingClass(diffState);

  // ── SCAFFOLD — replace with your styled node-box chain + arrows. ──
  return (
    <div className={`rounded-md border bg-card p-3 ${ring}`}>
      <div className="mb-2 font-mono text-[12px] font-medium text-sky-300">{name}</div>
      <div className="flex flex-wrap items-center gap-1">
        {chain.map((llNode, i) => {
          const data = nodeDataEntries(llNode);
          return (
            <div key={i} className="flex items-center gap-1">
              <div className="rounded border bg-muted px-2 py-1 font-mono text-[12px]">
                {data.map((d) => (
                  <div key={d.label} className="flex items-center gap-1">
                    <span className="text-zinc-400">{d.label}:</span>
                    <ValueView node={d.val} />
                  </div>
                ))}
              </div>
              {i < chain.length - 1 && (
                <span className="text-muted-foreground">→</span>
              )}
            </div>
          );
        })}
        {truncated && (
          <span className="text-muted-foreground">→ …</span>
        )}
        {chain.length > 0 && !truncated && (
          <span className="text-muted-foreground">→ null</span>
        )}
        {chain.length === 0 && (
          <span className="text-[12px] text-muted-foreground">(empty / null)</span>
        )}
      </div>
    </div>
  );
}

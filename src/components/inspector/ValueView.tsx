"use client";

import type { ReactNode } from "react";

import type { ValueNode } from "@/types/snapshot";
import { cn } from "@/lib/utils";

/**
 * Recursively renders a serialized Python value (a {@link ValueNode}) as
 * compact, color-coded, monospace text. Shared by the Variable Inspector and
 * the call-stack panel; the same node tree will feed the memory / DSA
 * visualizers in later phases.
 */
export function ValueView({ node }: { node: ValueNode }) {
  return <span className="font-mono text-[13px] leading-relaxed">{render(node)}</span>;
}

function render(node: ValueNode): ReactNode {
  switch (node.kind) {
    case "int":
    case "float":
      return <span className="text-emerald-400">{node.repr}</span>;
    case "bool":
      return <span className="text-purple-400">{node.repr}</span>;
    case "none":
      return <span className="text-zinc-500">None</span>;
    case "str":
      return <span className="text-amber-400">{node.repr}</span>;

    case "list":
    case "tuple":
    case "set":
      return <CollectionView node={node} />;

    case "dict":
      return <DictView node={node} />;

    case "object":
      return <ObjectView node={node} />;

    case "function":
      return (
        <span className="text-sky-400">
          {node.repr}
          <span className="text-zinc-500">()</span>
        </span>
      );

    case "module":
      return <span className="text-zinc-500 italic">{node.repr}</span>;

    case "circular":
      return <span className="text-rose-400 italic">↻ circular ref</span>;

    case "truncated":
      return <span className="text-zinc-500 italic" title={node.repr}>…</span>;

    default:
      return <span className="text-zinc-300">{node.repr}</span>;
  }
}

const OPEN: Record<string, string> = { list: "[", tuple: "(", set: "{" };
const CLOSE: Record<string, string> = { list: "]", tuple: ")", set: "}" };

function CollectionView({ node }: { node: ValueNode }) {
  const items = node.items ?? [];
  return (
    <span>
      <Bracket>{OPEN[node.kind] ?? "["}</Bracket>
      {items.map((item, i) => (
        <span key={i}>
          {i > 0 && <Punct>, </Punct>}
          {render(item)}
        </span>
      ))}
      {node.truncated && <Ellipsis length={node.length} shown={items.length} />}
      <Bracket>{CLOSE[node.kind] ?? "]"}</Bracket>
    </span>
  );
}

function DictView({ node }: { node: ValueNode }) {
  const entries = node.entries ?? [];
  return (
    <span>
      <Bracket>{"{"}</Bracket>
      {entries.map((entry, i) => (
        <span key={i}>
          {i > 0 && <Punct>, </Punct>}
          {render(entry.key)}
          <Punct>: </Punct>
          {render(entry.value)}
        </span>
      ))}
      {node.truncated && <Ellipsis length={node.length} shown={entries.length} />}
      <Bracket>{"}"}</Bracket>
    </span>
  );
}

function ObjectView({ node }: { node: ValueNode }) {
  const attrs = node.attributes ?? [];
  return (
    <span>
      <span className="text-sky-400">{node.pyType}</span>
      <Bracket>(</Bracket>
      {attrs.map((attr, i) => (
        <span key={attr.name}>
          {i > 0 && <Punct>, </Punct>}
          <span className="text-zinc-400">{attr.name}</span>
          <Punct>=</Punct>
          {render(attr.value)}
        </span>
      ))}
      <Bracket>)</Bracket>
    </span>
  );
}

function Bracket({ children }: { children: ReactNode }) {
  return <span className="text-zinc-500">{children}</span>;
}

function Punct({ children }: { children: ReactNode }) {
  return <span className="text-zinc-500">{children}</span>;
}

function Ellipsis({ length, shown }: { length?: number; shown: number }) {
  const remaining = typeof length === "number" ? length - shown : undefined;
  return (
    <span
      className={cn("text-zinc-500 italic")}
      title={remaining ? `${remaining} more not shown` : "truncated"}
    >
      , …
    </span>
  );
}

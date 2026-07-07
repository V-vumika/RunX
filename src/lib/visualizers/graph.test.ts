import { describe, it, expect } from "vitest";
import type { ValueNode } from "@/types/snapshot";
import { parseGraph, parseDist, parseFrontierNodes } from "./graph";

const vint = (n: number): ValueNode => ({ kind: "int", pyType: "int", repr: String(n), value: n });
const vstr = (s: string): ValueNode => ({ kind: "str", pyType: "str", repr: `'${s}'`, value: s });
const list = (items: ValueNode[]): ValueNode => ({ kind: "list", pyType: "list", repr: "[...]", items });
const tup  = (items: ValueNode[]): ValueNode => ({ kind: "tuple", pyType: "tuple", repr: "(...)", items });
const dict = (pairs: [ValueNode, ValueNode][]): ValueNode => ({
  kind: "dict", pyType: "dict", repr: "{...}", entries: pairs.map(([key, value]) => ({ key, value })),
});

describe("parseGraph", () => {
  it("parses an unweighted adjacency list", () => {
    const g = parseGraph(dict([
      [vstr("A"), list([vstr("B"), vstr("C")])],
      [vstr("B"), list([vstr("A")])],
      [vstr("C"), list([vstr("A")])],
    ]));
    expect(g).not.toBeNull();
    expect(g!.weighted).toBe(false);
    expect(g!.nodes.sort()).toEqual(["A", "B", "C"]);
    // A-B, A-C — the B-A / C-A back-edges dedupe away
    expect(g!.edges).toHaveLength(2);
  });

  it("parses a weighted adjacency of (neighbour, weight) tuples", () => {
    const g = parseGraph(dict([
      [vstr("A"), list([tup([vstr("B"), vint(4)]), tup([vstr("C"), vint(1)])])],
      [vstr("B"), list([])],
      [vstr("C"), list([])],
    ]));
    expect(g!.weighted).toBe(true);
    const ab = g!.edges.find((e) => e.to === "B" || e.from === "B");
    expect(ab!.w).toBe(4);
  });

  it("parses a weighted {neighbour: weight} dict-of-dicts", () => {
    const g = parseGraph(dict([
      [vint(0), dict([[vint(1), vint(7)]])],
      [vint(1), dict([])],
    ]));
    expect(g!.weighted).toBe(true);
    expect(g!.edges[0].w).toBe(7);
  });

  it("returns null for non-dict input", () => {
    expect(parseGraph(list([vint(1)]))).toBeNull();
    expect(parseGraph(undefined)).toBeNull();
  });
});

describe("parseDist", () => {
  it("reads a node→distance dict, ∞ for non-numeric", () => {
    const d = parseDist(dict([
      [vstr("A"), vint(0)],
      [vstr("B"), vint(4)],
      [vstr("C"), { kind: "float", pyType: "float", repr: "inf", value: "inf" }],
    ]));
    expect(d.get("A")).toBe(0);
    expect(d.get("B")).toBe(4);
    expect(Number.isFinite(d.get("C")!)).toBe(false);
  });
  it("reads a list as index→distance", () => {
    const d = parseDist(list([vint(0), vint(2), vint(5)]));
    expect(d.get("1")).toBe(2);
  });
});

describe("parseFrontierNodes", () => {
  const nodes = new Set(["A", "B", "C"]);
  it("pulls the node out of (dist, node) heap tuples regardless of order", () => {
    const heap = list([tup([vint(0), vstr("A")]), tup([vstr("B"), vint(4)])]);
    expect(parseFrontierNodes(heap, nodes)).toEqual(new Set(["A", "B"]));
  });
  it("handles a bare list of node ids", () => {
    expect(parseFrontierNodes(list([vstr("C")]), nodes)).toEqual(new Set(["C"]));
  });
});

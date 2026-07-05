import { describe, it, expect } from "vitest";
import type { ValueNode } from "@/types/snapshot";
import { describeSeqChange } from "./narrate";

const vint = (n: number): ValueNode => ({ kind: "int", pyType: "int", repr: String(n), value: n });
const vlist = (items: ValueNode[]): ValueNode => ({
  kind: "list",
  pyType: "list",
  repr: `[${items.map((i) => i.repr).join(", ")}]`,
  items,
});

describe("describeSeqChange", () => {
  it("recognizes a swap (and keeps the word the classifier looks for)", () => {
    const change = describeSeqChange("arr", vlist([vint(3), vint(1)]), vlist([vint(1), vint(3)]));
    expect(change?.label.toLowerCase()).toContain("swap");
    expect(change?.after).toBeNull(); // standalone phrase, not before→after
  });

  it("recognizes a single index assignment with before/after", () => {
    const change = describeSeqChange("arr", vlist([vint(1), vint(2), vint(3)]), vlist([vint(1), vint(5), vint(3)]));
    expect(change?.label).toBe("arr[1]");
    expect(change?.before).toBe("2");
    expect(change?.after).toBe("5");
  });

  it("recognizes an append to the end", () => {
    const change = describeSeqChange("arr", vlist([vint(1), vint(2)]), vlist([vint(1), vint(2), vint(3)]));
    expect(change?.label).toContain("Added");
    expect(change?.label).toContain("end");
  });

  it("returns null when nothing changed", () => {
    expect(describeSeqChange("arr", vlist([vint(1)]), vlist([vint(1)]))).toBeNull();
  });
});

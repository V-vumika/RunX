import { describe, it, expect } from "vitest";
import type { RunResult, Snapshot } from "@/types/snapshot";

import { classifyProgram } from "@/lib/explain/classify";
import { narrateAll } from "@/lib/explain/narrate";
import { measureRun } from "@/lib/explain/measure";
import { detectLiveStructures } from "@/lib/visualizers/detect-live";

import bubble from "@/lib/__fixtures__/bubble_sort.json";
import twoPointer from "@/lib/__fixtures__/two_pointer.json";

/**
 * Golden-trace tests. These fixtures are REAL traces captured by running the
 * worker's own Python (`src/lib/__fixtures__/*.json`, regenerated from
 * pyodide.worker.js). Running the full pipeline on them guards the whole
 * contract — if the serialized shape drifts from the TS types, or the
 * classifier/detector/narrator break on real data, these fail.
 */

type Fixture = { code: string; result: RunResult };
const bubbleFx = bubble as unknown as Fixture;
const twoFx = twoPointer as unknown as Fixture;

describe("golden: bubble sort", () => {
  const { code, result } = bubbleFx;
  const snapshots = result.snapshots as Snapshot[];

  it("produced a real trace with no error", () => {
    expect(snapshots.length).toBeGreaterThan(10);
    expect(result.error).toBeNull();
  });

  it("classifies as a sort (real swaps detected)", () => {
    expect(classifyProgram(code, snapshots).kind).toBe("sort");
  });

  it("narrates every step without throwing, and reports a swap", () => {
    const steps = narrateAll(snapshots, code);
    expect(steps).toHaveLength(snapshots.length);
    const sawSwap = steps.some((s) => (s.changes ?? []).some((c) => /swap/i.test(c.label)));
    expect(sawSwap).toBe(true);
  });

  it("measures real operations", () => {
    const m = measureRun(snapshots);
    expect(m!.steps).toBeGreaterThan(0);
    expect(m!.inputSize).toBe(4);
  });
});

describe("golden: two-pointer", () => {
  const { code, result } = twoFx;
  const snapshots = result.snapshots as Snapshot[];

  it("detects the array with live left/right pointers mid-run", () => {
    // A step where both pointers exist in the two_sum frame.
    const idx = snapshots.findIndex((s) => {
      const f = s.stack.at(-1);
      return f?.functionName === "two_sum" && f.locals.some((v) => v.name === "left") && f.locals.some((v) => v.name === "right");
    });
    expect(idx).toBeGreaterThan(0);

    const structures = detectLiveStructures(snapshots[idx], snapshots[idx - 1], code);
    const arr = structures.find((s) => s.view === "array");
    expect(arr).toBeDefined();
    const names = (arr!.overlay?.pointers ?? []).map((p) => p.name);
    expect(names).toContain("left");
    expect(names).toContain("right");
  });

  it("narrates cleanly", () => {
    expect(narrateAll(snapshots, code)).toHaveLength(snapshots.length);
  });
});

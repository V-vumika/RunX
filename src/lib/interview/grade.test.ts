import { describe, expect, it } from "vitest";

import { gradeComplexity, normalizeOutput, outputMatches } from "./grade";

describe("gradeComplexity", () => {
  it("is optimal when achieved is at or better than the target", () => {
    expect(gradeComplexity("O(n)", "O(n)", "note").verdict).toBe("optimal");
    expect(gradeComplexity("O(log n)", "O(n)", "note").verdict).toBe("optimal");
    expect(gradeComplexity("O(1)", "O(n)", "note").verdict).toBe("optimal");
  });

  it("is above-target when achieved is worse than the target", () => {
    const g = gradeComplexity("O(n²)", "O(n)", "note");
    expect(g.verdict).toBe("above-target");
    expect(g.message).toContain("O(n²)");
    expect(g.message).toContain("O(n)");
  });

  it("is unranked when there's nothing to grade yet", () => {
    expect(gradeComplexity(undefined, "O(n)", "note").verdict).toBe("unranked");
    expect(gradeComplexity(null, "O(n)", "note").verdict).toBe("unranked");
    expect(gradeComplexity("—", "O(n)", "note").verdict).toBe("unranked");
  });
});

describe("normalizeOutput / outputMatches", () => {
  it("treats Python and JS array formatting as equal", () => {
    expect(normalizeOutput("[0, 1]")).toBe(normalizeOutput("[ 0, 1 ]"));
    expect(outputMatches("[ 0, 1 ]\n", "[0, 1]")).toBe(true);
  });

  it("treats Python True/False and JS true/false as equal", () => {
    expect(outputMatches("True\n", "True")).toBe(true);
    expect(outputMatches("true\n", "True")).toBe(true);
    expect(outputMatches("False\n", "True")).toBe(false);
  });

  it("is whitespace and case insensitive", () => {
    expect(outputMatches("  6\n", "6")).toBe(true);
    expect(outputMatches("Hello\n", "hello")).toBe(true);
  });

  it("rejects empty actual output", () => {
    expect(outputMatches("", "0")).toBe(false);
    expect(outputMatches("   \n", "0")).toBe(false);
  });

  it("rejects a genuine mismatch", () => {
    expect(outputMatches("5\n", "6")).toBe(false);
  });
});

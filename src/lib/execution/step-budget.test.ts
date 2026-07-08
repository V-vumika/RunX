import { describe, it, expect } from "vitest";
import { stepBudget, MIN_STEP_BUDGET, MAX_STEP_BUDGET, STEPS_PER_LINE } from "./step-budget";

describe("stepBudget", () => {
  it("gives an empty / comment-only script the minimum budget", () => {
    expect(stepBudget("")).toBe(MIN_STEP_BUDGET);
    expect(stepBudget("# just a comment")).toBe(MIN_STEP_BUDGET);
  });

  it("ignores blank and comment lines when sizing", () => {
    const code = "# a comment\n\n   \nx = 1\n# another";
    // only `x = 1` counts → 1 meaningful line
    expect(stepBudget(code)).toBe(MIN_STEP_BUDGET + STEPS_PER_LINE);
  });

  it("scales the budget up with program size", () => {
    const code = Array.from({ length: 40 }, (_, i) => `a${i} = ${i}`).join("\n");
    expect(stepBudget(code)).toBe(MIN_STEP_BUDGET + 40 * STEPS_PER_LINE);
  });

  it("clamps to the maximum for very large programs", () => {
    const code = Array.from({ length: 5000 }, (_, i) => `a${i} = ${i}`).join("\n");
    expect(stepBudget(code)).toBe(MAX_STEP_BUDGET);
  });
});

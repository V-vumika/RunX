/**
 * Interview-mode grading — two small, pure, rules-based helpers. No LLM: the
 * complexity comparison reuses the existing rules-based classifier's output
 * (classify.ts), and the output check is a loose text comparison. This mirrors
 * the project's standing rule that classification is always rules-based, never
 * guessed by a model.
 */

/** Ranks the Big-O classes classify.ts can emit, worst not included (not a target). */
const COMPLEXITY_RANK: Record<string, number> = {
  "O(1)": 0,
  "O(log n)": 1,
  "O(n)": 2,
  "O(n log n)": 3,
  "O(n²)": 4,
  "O(n³)": 5,
  "O(2ⁿ)": 6,
};

export type ComplexityVerdict = "optimal" | "above-target" | "unranked";

export interface ComplexityGrade {
  verdict: ComplexityVerdict;
  message: string;
}

/**
 * Compare the classifier's measured complexity against a problem's target.
 * `unranked` covers "—" / not-yet-run / any class we don't have an order for.
 */
export function gradeComplexity(
  achieved: string | undefined | null,
  target: string,
  note: string
): ComplexityGrade {
  if (!achieved || !(achieved in COMPLEXITY_RANK)) {
    return { verdict: "unranked", message: "Run your solution to see its measured complexity." };
  }
  const a = COMPLEXITY_RANK[achieved];
  const t = COMPLEXITY_RANK[target] ?? Infinity;
  if (a <= t) {
    return { verdict: "optimal", message: `${achieved} meets the target of ${target}. ${note}` };
  }
  return {
    verdict: "above-target",
    message: `Your solution measures ${achieved}; the target is ${target}. ${note}`,
  };
}

/** Case/whitespace-insensitive normalization so Python's `[0, 1]` / `True` and
 *  JS's `[ 0, 1 ]` / `true` compare equal — the two languages format console
 *  output slightly differently, but the underlying value is the same. */
export function normalizeOutput(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "");
}

export function outputMatches(actual: string, expected: string): boolean {
  if (!actual.trim()) return false;
  return normalizeOutput(actual) === normalizeOutput(expected);
}

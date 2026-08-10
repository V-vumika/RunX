# Interview mode

`/app/interview` (`src/components/interview/`) lets you practice a small,
curated bank of classic DSA problems (`src/lib/interview/problems.ts`)
against a target complexity — no LLM anywhere in this path.

## How a problem works

Each `InterviewProblem` ships a **driverless starter function** in both
Python and JavaScript (same parameter names in both, so one set of example
inputs drives either language). Because the starter has no top-level call,
the existing entry-synthesis machinery (`src/lib/execution/entry/`) detects
it exactly like a pasted LeetCode solution, and `InputsPanel` collects
arguments — nothing interview-specific was added to the execution path
itself.

## Grading (`src/lib/interview/grade.ts`)

Two small, pure, rules-based checks, both reusing existing machinery:

- **`gradeComplexity`** — ranks Big-O classes (`O(1)` … `O(2ⁿ)`) and compares
  the classifier's *measured* result for your solution against the
  problem's `targetComplexity`. `"optimal"` if you're at or below target,
  `"above-target"` if not, `"unranked"` if nothing measurable yet (haven't
  run, or an unranked class).
- **`outputMatches`** — a loose, case/whitespace-insensitive text comparison
  between your program's printed output and the problem's
  `expectedOutput`, so Python's `[0, 1]` and JS's `[ 0, 1 ]` (or `True` vs.
  `true`) compare equal.

Neither check re-implements or bypasses the classifier in `classify.ts` — see
`docs/COMPLEXITY.md` for how the underlying class is actually decided.

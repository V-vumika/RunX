import { describe, expect, it } from "vitest";

import { getEntryRunner } from "@/lib/execution/entry";
import { INTERVIEW_PROBLEMS } from "./problems";
import { outputMatches } from "./grade";

const LANGS = ["python", "javascript"] as const;

describe("interview problem bank", () => {
  it("has at least one example per problem", () => {
    for (const p of INTERVIEW_PROBLEMS) {
      expect(p.examples.length).toBeGreaterThan(0);
    }
  });

  it("has at least one hint per problem", () => {
    for (const p of INTERVIEW_PROBLEMS) {
      expect(p.hints.length).toBeGreaterThan(0);
    }
  });

  for (const p of INTERVIEW_PROBLEMS) {
    describe(p.id, () => {
      for (const lang of LANGS) {
        it(`starter is detected as a driverless free function (${lang})`, () => {
          const runner = getEntryRunner(lang)!;
          const entry = runner.detectEntry(p.starter[lang]);
          expect(entry.kind).toBe("free-function");

          // Param names match every example's input keys exactly (order-independent) —
          // this is what lets one set of example inputs drive both languages.
          const expected = [...Object.keys(p.examples[0].inputs)].sort();
          expect([...entry.params].sort()).toEqual(expected);
          for (const ex of p.examples) {
            expect([...Object.keys(ex.inputs)].sort()).toEqual(expected);
          }
        });

        it(`buildSource assigns every param and calls the entry point (${lang})`, () => {
          const runner = getEntryRunner(lang)!;
          const entry = runner.detectEntry(p.starter[lang]);
          const inputs = p.examples[0].inputs;
          const src = runner.buildSource(p.starter[lang], entry, inputs);
          expect(src.startsWith(p.starter[lang])).toBe(true);
          for (const [name, value] of Object.entries(inputs)) {
            expect(src).toContain(name);
            expect(src).toContain(value);
          }
        });
      }
    });
  }

  it("target complexity is one of the classifier's known classes", () => {
    const known = new Set(["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)", "O(n³)", "O(2ⁿ)"]);
    for (const p of INTERVIEW_PROBLEMS) {
      expect(known.has(p.targetComplexity)).toBe(true);
    }
  });

  it("expected outputs for a problem are self-consistent under normalization", () => {
    // Sanity guard against a copy-paste typo: no two examples of the same
    // problem should have the same expected output (Two Sum's two cases both
    // expect different pairs, etc.) — catches an accidental duplicate.
    for (const p of INTERVIEW_PROBLEMS) {
      const outs = p.examples.map((e) => e.expectedOutput);
      const unique = new Set(outs.map((o) => o.trim().toLowerCase().replace(/\s+/g, "")));
      expect(unique.size).toBe(outs.length);
    }
  });

  it("outputMatches accepts each problem's own expected output against itself", () => {
    for (const p of INTERVIEW_PROBLEMS) {
      for (const ex of p.examples) {
        expect(outputMatches(ex.expectedOutput, ex.expectedOutput)).toBe(true);
      }
    }
  });
});

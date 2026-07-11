"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight, Lightbulb, Target, X } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useExecutionStore } from "@/lib/store/execution-store";
import { classifyProgram } from "@/lib/explain/classify";
import type { InterviewProblem } from "@/lib/interview/problems";
import { gradeComplexity, outputMatches } from "@/lib/interview/grade";

const DIFFICULTY_VARIANT: Record<string, string> = {
  Easy: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  Medium: "text-amber-400 border-amber-500/30 bg-amber-500/10",
};

/**
 * The "Problem" tab: prompt, constraints, examples you can load into the
 * Inputs panel and run, progressive hints, and — once a trace exists — the
 * measured complexity graded against the problem's target and an output
 * check against whichever example was last tried. All grading is rules-based
 * (reuses the existing classifier + a plain text comparison); no LLM.
 */
export function ProblemPanel({ problem }: { problem: InterviewProblem }) {
  const [hintsShown, setHintsShown] = useState(0);
  const [activeExample, setActiveExample] = useState(0);

  const code = useExecutionStore((s) => s.code);
  const language = useExecutionStore((s) => s.language);
  const snapshots = useExecutionStore((s) => s.snapshots);
  const result = useExecutionStore((s) => s.result);
  const isRunning = useExecutionStore((s) => s.isRunning);
  const setInput = useExecutionStore((s) => s.setInput);
  const run = useExecutionStore((s) => s.run);

  const hasTrace = snapshots.length > 0;
  const summary = useMemo(
    () => (hasTrace ? classifyProgram(code, snapshots, result?.complexity, language) : null),
    [hasTrace, code, snapshots, result?.complexity, language]
  );
  const complexityGrade = useMemo(
    () => gradeComplexity(summary?.complexity, problem.targetComplexity, problem.complexityNote),
    [summary?.complexity, problem.targetComplexity, problem.complexityNote]
  );

  const example = problem.examples[activeExample];
  const outputOk = hasTrace && result ? outputMatches(result.stdout, example.expectedOutput) : null;

  function tryExample(index: number) {
    setActiveExample(index);
    const ex = problem.examples[index];
    for (const [name, value] of Object.entries(ex.inputs)) setInput(name, value);
    // setInput writes synchronously to the store, so run() (called on the next
    // tick) reads the freshly-set values.
    setTimeout(() => run(), 0);
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-3">
        {/* Header */}
        <div className="rounded-md border bg-card p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{problem.title}</span>
            <Badge variant="outline" className={DIFFICULTY_VARIANT[problem.difficulty]}>
              {problem.difficulty}
            </Badge>
            <span className="ml-auto inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
              <Target className="size-3" />
              target {problem.targetComplexity}
            </span>
          </div>
          <div className="mt-2 space-y-1.5">
            {problem.prompt.map((para, i) => (
              <p key={i} className="text-xs leading-relaxed text-muted-foreground">
                {para}
              </p>
            ))}
          </div>
          {problem.constraints.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {problem.constraints.map((c) => (
                <li key={c} className="flex items-start gap-1.5 font-mono text-[11px] text-muted-foreground/80">
                  <span className="mt-1 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Examples */}
        <div className="rounded-md border bg-card p-3">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Examples
          </div>
          <div className="space-y-1.5">
            {problem.examples.map((ex, i) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => tryExample(i)}
                disabled={isRunning}
                className={`flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-[11px] transition-colors disabled:opacity-50 ${
                  activeExample === i
                    ? "border-void-violet/40 bg-void-violet/10"
                    : "border-border/50 bg-muted/20 hover:bg-muted/40"
                }`}
              >
                <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate font-mono text-foreground/90">{ex.label}</span>
                <span className="shrink-0 text-muted-foreground">
                  → <span className="font-mono">{ex.expectedOutput}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Hints */}
        <div className="rounded-md border bg-card p-3">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <Lightbulb className="size-3.5" />
            Hints
          </div>
          <div className="space-y-1.5">
            {problem.hints.slice(0, hintsShown).map((h, i) => (
              <p key={i} className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-mono text-muted-foreground/60">{i + 1}.</span> {h}
              </p>
            ))}
          </div>
          {hintsShown < problem.hints.length && (
            <button
              type="button"
              onClick={() => setHintsShown((n) => n + 1)}
              className="mt-1.5 rounded-md border border-dashed border-border/60 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Show hint {hintsShown + 1} of {problem.hints.length}
            </button>
          )}
        </div>

        {/* Results — only once there's something to grade */}
        {hasTrace && summary && (
          <div className="rounded-md border bg-card p-3">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              This run
            </div>

            <div className="flex items-center gap-2">
              {outputOk === null ? null : outputOk ? (
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                  <Check className="size-3.5" /> Output matches the example
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400">
                  <X className="size-3.5" /> Output doesn&apos;t match yet
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <Badge
                variant="secondary"
                className={`font-mono text-[11px] ${
                  complexityGrade.verdict === "optimal"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : complexityGrade.verdict === "above-target"
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                      : ""
                }`}
              >
                {summary.complexity}
              </Badge>
              <span className="text-[11px] text-muted-foreground">{summary.title}</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{complexityGrade.message}</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

"use client";

import { useMemo } from "react";
import { Activity, Lightbulb, TrendingUp } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useExecutionStore } from "@/lib/store/execution-store";
import { classifyProgram, deriveSpaceComplexity } from "@/lib/explain/classify";

export function ComplexityPanel() {
  const snapshots = useExecutionStore((s) => s.snapshots);
  const code = useExecutionStore((s) => s.code);
  const result = useExecutionStore((s) => s.result);

  const hasTrace = snapshots.length > 0;
  const complexity = result?.complexity;

  const summary = useMemo(
    () => (hasTrace ? classifyProgram(code, snapshots, complexity) : null),
    [snapshots, code, hasTrace, complexity]
  );
  const space = useMemo(
    () => (summary ? deriveSpaceComplexity(summary, complexity) : null),
    [summary, complexity]
  );

  if (!hasTrace || !summary) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div className="max-w-sm">
          <TrendingUp className="mx-auto mb-3 size-7 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Press <span className="font-medium text-foreground">Run</span> to
            analyze the time and space complexity of your code.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-3">

        {/* Big-O summary card */}
        <div className="rounded-md border bg-card p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Activity className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              {summary.title}
            </span>
            <Badge variant="secondary" className="font-mono text-[11px]">
              {summary.complexity}
            </Badge>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">Why:</span>{" "}
            {summary.complexityReason}.
          </p>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            label="Time complexity"
            value={summary.complexity}
            sub="worst case"
          />
          <MetricCard
            label="Space complexity"
            value={space?.value ?? "—"}
            sub="auxiliary"
          />
          <MetricCard
            label="Loop depth"
            value={
              complexity?.maxLoopDepth != null
                ? String(complexity.maxLoopDepth)
                : "—"
            }
            sub="max nesting"
          />
          <MetricCard
            label="Recursion"
            value={
              complexity?.recursion?.length
                ? `${complexity.recursion.length} fn`
                : "none"
            }
            sub="recursive calls"
          />
        </div>

        {/* Algorithm signals */}
        {summary.signals.length > 0 && (
          <div className="rounded-md border bg-card p-3">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Patterns detected
            </div>
            <div className="flex flex-wrap gap-1.5">
              {summary.signals.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Key idea callout */}
        {summary.keyIdea && (
          <div className="flex items-start gap-2 rounded-md bg-amber-500/10 px-3 py-2.5">
            <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
            <p className="text-xs leading-relaxed text-amber-200/90">
              {summary.keyIdea}
            </p>
          </div>
        )}

        {/* Recursion details */}
        {complexity?.recursion && complexity.recursion.length > 0 && (
          <div className="rounded-md border bg-card p-3">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Recursive functions
            </div>
            <div className="space-y-1.5">
              {complexity.recursion.map((r) => (
                <div key={r.name} className="flex items-center justify-between text-xs">
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                    {r.name}()
                  </code>
                  <span className="text-muted-foreground">
                    {r.selfCalls} self-call{r.selfCalls !== 1 ? "s" : ""} ·{" "}
                    {r.shrink === "half"
                      ? "halves input"
                      : r.shrink === "decrement"
                      ? "decrements input"
                      : "other reduction"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </ScrollArea>
  );
}

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-md border bg-muted/40 p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-mono text-lg font-semibold text-foreground">
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground/70">{sub}</div>
    </div>
  );
}

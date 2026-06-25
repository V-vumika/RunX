"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRightLeft,
  CornerDownLeft,
  Equal,
  GitBranch,
  Lightbulb,
  Loader2,
  PhoneCall,
  Printer,
  RefreshCw,
  Repeat,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useExecutionStore } from "@/lib/store/execution-store";
import { narrateAll, valuesOnLine, type StepExplanation, type StepKind } from "@/lib/explain/narrate";
import { classifyProgram } from "@/lib/explain/classify";
import { explainException } from "@/lib/explain/exceptions";

/** Render `text` with `\`code\`` spans as <code>. */
function richText(text: string) {
  return text.split(/(`[^`]+`)/g).map((seg, i) =>
    seg.startsWith("`") && seg.endsWith("`") ? (
      <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
        {seg.slice(1, -1)}
      </code>
    ) : (
      <span key={i}>{seg}</span>
    )
  );
}

/** Meaningful colour per step kind — read at a glance in the walkthrough. */
function kindColor(kind: StepKind): string {
  switch (kind) {
    case "call":   return "text-violet-400";
    case "return": return "text-emerald-400";
    case "mutate": return "text-amber-400";
    case "assign": return "text-sky-400";
    case "branch": return "text-fuchsia-400";
    case "loop":   return "text-cyan-400";
    case "print":  return "text-teal-400";
    case "error":  return "text-destructive";
    case "start":  return "text-primary";
    default:       return "text-muted-foreground";
  }
}

function KindIcon({ kind, className }: { kind: StepKind; className?: string }) {
  switch (kind) {
    case "call":   return <PhoneCall className={className} />;
    case "return": return <CornerDownLeft className={className} />;
    case "mutate": return <ArrowRightLeft className={className} />;
    case "assign": return <Equal className={className} />;
    case "branch": return <GitBranch className={className} />;
    case "loop":   return <Repeat className={className} />;
    case "print":  return <Printer className={className} />;
    case "error":  return <TriangleAlert className={className} />;
    case "start":  return <Sparkles className={className} />;
    default:       return <Equal className={className} />;
  }
}

export function ExplainPanel() {
  const snapshots   = useExecutionStore((s) => s.snapshots);
  const code        = useExecutionStore((s) => s.code);
  const currentStep = useExecutionStore((s) => s.currentStep);
  const goToStep    = useExecutionStore((s) => s.goToStep);
  const result      = useExecutionStore((s) => s.result);

  const hasTrace = snapshots.length > 0;
  const error = result?.error ?? null;
  const complexity = result?.complexity;

  const summary = useMemo(
    () => (hasTrace ? classifyProgram(code, snapshots, complexity) : null),
    [snapshots, code, hasTrace, complexity]
  );
  const explanations = useMemo<StepExplanation[]>(
    () => (hasTrace ? narrateAll(snapshots, code, summary?.kind) : []),
    [snapshots, code, hasTrace, summary?.kind]
  );

  // Keep the active walkthrough row in view as you step.
  const activeRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [currentStep]);

  if (!hasTrace && !error) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div className="max-w-sm">
          <Lightbulb className="mx-auto mb-3 size-7 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Paste or write any Python code and press <span className="font-medium text-foreground">Run</span>.
            RunX will detect what kind of code it is and walk you through it line by line.
          </p>
        </div>
      </div>
    );
  }

  const current = explanations[currentStep];
  const transcript = explanations.slice(0, currentStep + 1);
  const onLineValues = current
    ? valuesOnLine(current.detail, snapshots[currentStep]?.stack.at(-1) ?? null)
    : [];

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-3">
        {error && <ExceptionCard type={error.type} message={error.message} line={error.line} />}

        {/* Current step — the big "what just happened" line. */}
        {current && (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="rounded-md border bg-card p-3 shadow-sm"
          >
            <div className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <KindIcon kind={current.kind} className={`size-3.5 ${kindColor(current.kind)}`} />
              Step {currentStep + 1} / {explanations.length} · line {current.line}
            </div>
            <p className="text-sm leading-relaxed text-foreground">{richText(current.text)}</p>
            {current.detail && (
              <pre className="mt-2 overflow-x-auto rounded bg-muted/60 px-2 py-1 font-mono text-xs text-muted-foreground">
                {current.detail}
              </pre>
            )}
            {onLineValues.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">values now</span>
                {onLineValues.map((v) => (
                  <span
                    key={v.name}
                    className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground"
                  >
                    {v.name} = <span className="text-muted-foreground">{v.repr}</span>
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Running transcript — click any line to jump there. */}
        {hasTrace && (
        <div>
          <div className="mb-1.5 px-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Walkthrough
          </div>
          <ol className="space-y-0.5">
            {transcript.map((ex, i) => {
              const active = i === currentStep;
              const indent = Math.min((ex.depth ?? 1) - 1, 6) * 14;
              return (
                <li key={i} ref={active ? activeRef : undefined}>
                  <button
                    onClick={() => goToStep(i)}
                    style={{ marginLeft: indent }}
                    className={`flex w-full items-start gap-2 rounded border-l-2 px-2 py-1 text-left text-xs transition-colors ${
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/60"
                    }`}
                  >
                    <span className="mt-0.5 w-8 shrink-0 text-right font-mono text-[10px] opacity-50">
                      L{ex.line}
                    </span>
                    <KindIcon kind={ex.kind} className={`mt-0.5 size-3 shrink-0 ${kindColor(ex.kind)}`} />
                    <span className="min-w-0">{richText(ex.text)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
        )}
      </div>
    </ScrollArea>
  );
}

export function SummaryCard({
  summary,
  code,
  current,
}: {
  summary: ReturnType<typeof classifyProgram>;
  code: string;
  current?: StepExplanation;
}) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-foreground">{summary.title}</span>
        <Badge variant="secondary" className="font-mono text-[11px]">
          {summary.complexity}
        </Badge>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{summary.description}</p>
      <AiExplain summary={summary} code={code} current={current} />
    </div>
  );
}

/** Student-friendly explanation for an uncaught exception (Thonny "Assistant" style). */
function ExceptionCard({ type, message, line }: { type: string; message: string; line: number | null }) {
  const help = explainException(type, message);
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
        <TriangleAlert className="size-4" />
        {type}
        {line != null && <span className="font-mono text-xs font-normal opacity-80">· line {line}</span>}
      </div>
      {message && (
        <p className="mt-1 font-mono text-xs whitespace-pre-wrap text-destructive/90">{message}</p>
      )}
      <p className="mt-2 text-xs leading-relaxed text-foreground">{help.hint}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Try this:</span> {richText(help.fix)}
      </p>
    </div>
  );
}

/** Optional LLM "explain deeper" — scaffolded; degrades to a note when no provider. */
function AiExplain({
  summary,
  code,
  current,
}: {
  summary: ReturnType<typeof classifyProgram>;
  code: string;
  current?: StepExplanation;
}) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [text, setText] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);

  async function ask() {
    setState("loading");
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: summary.title,
          complexity: summary.complexity,
          code,
          currentStepText: current?.text,
          currentStepLine: current?.detail,
        }),
      });
      const data = (await res.json()) as { text: string | null; configured: boolean };
      setText(data.text);
      setConfigured(data.configured);
    } catch {
      setText(null);
      setConfigured(false);
    } finally {
      setState("done");
    }
  }

  return (
    <div className="mt-2.5 border-t pt-2.5">
      <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={ask} disabled={state === "loading"}>
        {state === "loading" ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
        Explain with AI
      </Button>
      {state === "done" && (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {configured && text ? (
            text
          ) : (
            <span className="flex items-start gap-1.5">
              <RefreshCw className="mt-0.5 size-3 shrink-0" />
              AI explanations aren&apos;t configured yet — the step-by-step walkthrough above is generated
              locally and always available.
            </span>
          )}
        </p>
      )}
    </div>
  );
}

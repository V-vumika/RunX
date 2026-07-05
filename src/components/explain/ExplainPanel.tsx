"use client";

import { useMemo } from "react";
import { TriangleAlert, Lightbulb } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useExecutionStore } from "@/lib/store/execution-store";
import { narrateAll, shortRepr, type StepKind } from "@/lib/explain/narrate";
import { classifyProgram, type AlgoKind } from "@/lib/explain/classify";
import { explainException } from "@/lib/explain/exceptions";
import type { Snapshot, Variable, ValueNode } from "@/types/snapshot";

import { SortViz }         from "@/components/visualizers/SortViz";
import { RecursionViz }    from "@/components/visualizers/RecursionViz";
import { BinarySearchViz } from "@/components/visualizers/BinarySearchViz";
import { GraphViz }        from "@/components/visualizers/GraphViz";
import { TreeViz }         from "@/components/visualizers/TreeViz";
import { LinkedListViz }   from "@/components/visualizers/LinkedListViz";
import { IterativeViz }    from "@/components/visualizers/IterativeViz";
import { TrieViz }         from "@/components/visualizers/TrieViz";
import { BacktrackingView } from "@/components/visualizers/BacktrackingView";
import { GenericViz }      from "@/components/visualizers/GenericViz";
import { StructureList }   from "@/components/visualizers/StructureList";
import { detectLiveStructures, NODE_VIEWS } from "@/lib/visualizers/detect-live";

// ── kind pill ────────────────────────────────────────────────────────────────

const KIND_CLASS: Record<StepKind, string> = {
  call:   "bg-violet-500/15 text-violet-300",
  return: "bg-emerald-500/15 text-emerald-300",
  mutate: "bg-amber-500/15 text-amber-300",
  assign: "bg-sky-500/15 text-sky-300",
  branch: "bg-fuchsia-500/15 text-fuchsia-300",
  loop:   "bg-cyan-500/15 text-cyan-300",
  print:  "bg-teal-500/15 text-teal-300",
  error:  "bg-destructive/15 text-destructive",
  start:  "bg-primary/15 text-primary",
  step:   "bg-muted text-muted-foreground",
};

function KindPill({ kind }: { kind: StepKind }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${KIND_CLASS[kind] ?? KIND_CLASS.step}`}>
      {kind}
    </span>
  );
}

// ── algo badge ────────────────────────────────────────────────────────────────

const ALGO_META: Record<string, { label: string; color: string }> = {
  sort:            { label: "Sort",          color: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  "binary-search": { label: "Binary Search", color: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  "linear-search": { label: "Linear Search", color: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  bfs:             { label: "BFS",           color: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" },
  dfs:             { label: "DFS",           color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  tree:            { label: "Tree",          color: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  "linked-list":   { label: "Linked List",   color: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30" },
  recursion:       { label: "Recursion",     color: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  backtracking:    { label: "Backtracking",  color: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  "nested-loop":   { label: "Nested Loop",   color: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  iterative:       { label: "Iterative",     color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  dp:              { label: "Dynamic Programming", color: "bg-pink-500/15 text-pink-300 border-pink-500/30" },
  trie:            { label: "Trie",          color: "bg-teal-500/15 text-teal-300 border-teal-500/30" },
  hashmap:         { label: "HashMap",       color: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30" },
  heap:            { label: "Heap",          color: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30" },
  script:          { label: "Script",        color: "bg-muted text-muted-foreground border-border" },
};

function AlgoBadge({ kind, complexity }: { kind: AlgoKind | "dp"; complexity: string }) {
  const m = ALGO_META[kind] ?? ALGO_META.script;
  return (
    <div className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 ${m.color}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      <span className="text-xs font-medium">{m.label}</span>
      <span className="font-mono text-[10px] opacity-60">{complexity}</span>
    </div>
  );
}

// ── variable diff ─────────────────────────────────────────────────────────────

function getLocals(snap: Snapshot | undefined): Map<string, ValueNode> {
  const m = new Map<string, ValueNode>();
  snap?.stack.at(-1)?.locals.forEach((v: Variable) => m.set(v.name, v.value));
  return m;
}

function VariableDiff({ prev, curr }: { prev: Snapshot | undefined; curr: Snapshot | undefined }) {
  const prevMap = getLocals(prev);
  const currMap = getLocals(curr);
  if (currMap.size === 0) return null;

  const rows: { name: string; oldV: string | null; newV: string; changed: boolean }[] = [];
  currMap.forEach((node, name) => {
    const pNode = prevMap.get(name);
    const nv = shortRepr(node);
    const ov = pNode ? shortRepr(pNode) : null;
    rows.push({ name, oldV: ov, newV: nv, changed: ov !== null && ov !== nv });
  });

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        variables
      </div>
      {rows.map((r) => (
        <div key={r.name} className={`flex items-center gap-2 border-b border-border/30 px-3 py-1.5 last:border-b-0 ${r.changed ? "bg-emerald-500/5" : ""}`}>
          <span className={`h-1.25 w-1.25 shrink-0 rounded-full ${r.changed ? "bg-emerald-400" : "bg-transparent"}`} />
          <span className={`min-w-16 font-mono text-[11px] ${r.changed ? "text-emerald-300/80" : "text-muted-foreground/60"}`}>
            {r.name}
          </span>
          <span className="flex flex-1 items-center gap-1.5 font-mono text-[11px]">
            {r.changed && r.oldV !== null ? (
              <>
                <span className="text-muted-foreground/40 line-through">{r.oldV}</span>
                <span className="text-muted-foreground/40 text-[10px]">→</span>
                <span className="font-medium text-emerald-400">{r.newV}</span>
              </>
            ) : (
              <span className="text-muted-foreground/50">{r.newV}</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── auto viz picker ───────────────────────────────────────────────────────────

// Algorithm animations + "wrapped" structures (tree/linked-list/trie) whose
// views do their own root-finding. Flat data structures (arrays/dicts/heaps/
// matrices) are handled per-variable by StructureList, not here.
const ALGO_VIEW_KINDS = new Set<AlgoKind>([
  "sort", "binary-search", "recursion", "bfs", "dfs",
  "tree", "linked-list", "trie", "backtracking", "nested-loop", "iterative",
]);
// Kinds whose algorithm view already draws the list — suppress a duplicate array view.
const SUPPRESS_FLAT = new Set<AlgoKind>(["sort", "binary-search"]);

function AutoViz({ kind, snapshots, step }: { kind: AlgoKind; snapshots: Snapshot[]; step: number }) {
  switch (kind) {
    case "sort":           return <SortViz snapshots={snapshots} step={step} />;
    case "recursion":      return <RecursionViz snapshots={snapshots} step={step} />;
    case "binary-search":  return <BinarySearchViz snapshots={snapshots} step={step} />;
    case "bfs":
    case "dfs":            return <GraphViz snapshots={snapshots} step={step} />;
    case "tree":           return <TreeViz snapshots={snapshots} step={step} />;
    case "linked-list":    return <LinkedListViz snapshots={snapshots} step={step} />;
    case "trie":           return <TrieViz snapshots={snapshots} step={step} />;
    case "backtracking":   return <BacktrackingView snapshots={snapshots} step={step} />;
    case "nested-loop":
    case "iterative":      return <IterativeViz snapshots={snapshots} step={step} />;
    default:               return null;
  }
}

// ── main panel ────────────────────────────────────────────────────────────────

export function ExplainPanel() {
  const snapshots   = useExecutionStore((s) => s.snapshots);
  const code        = useExecutionStore((s) => s.code);
  const currentStep = useExecutionStore((s) => s.currentStep);
  const result      = useExecutionStore((s) => s.result);
  const runError    = useExecutionStore((s) => s.runError);
  const warnings    = useExecutionStore((s) => s.supportWarnings);

  const hasTrace   = snapshots.length > 0;
  const error      = result?.error ?? null;
  const complexity = result?.complexity;

  const summary = useMemo(
    () => (hasTrace ? classifyProgram(code, snapshots, complexity) : null),
    [snapshots, code, hasTrace, complexity]
  );
  const explanations = useMemo(
    () => (hasTrace ? narrateAll(snapshots, code, summary?.kind) : []),
    [snapshots, code, hasTrace, summary?.kind]
  );
  const structures = useMemo(
    () => (hasTrace ? detectLiveStructures(snapshots[currentStep], snapshots[currentStep - 1], code) : []),
    [snapshots, currentStep, code, hasTrace]
  );

  // Blocked before running (e.g. input()) — show a clear, honest reason.
  if (!hasTrace && runError) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div className="max-w-sm rounded-md border border-amber-500/30 bg-amber-500/10 p-4">
          <TriangleAlert className="mx-auto mb-2 size-6 text-amber-400" />
          <p className="text-sm leading-relaxed text-foreground/90">{runError}</p>
        </div>
      </div>
    );
  }

  if (!hasTrace && !error) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div className="max-w-xs">
          <Lightbulb className="mx-auto mb-3 size-6 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Press <span className="font-medium text-foreground">Run</span> — RunX auto-detects
            the algorithm and visualizes it step by step.
          </p>
        </div>
      </div>
    );
  }

  const current  = explanations[currentStep];
  const prevSnap = snapshots[currentStep - 1];
  const currSnap = snapshots[currentStep];

  // When a pointer overlay or a grid view is active, that view *is* the data
  // visual — the loop-state view would just be a confusing static dupe.
  const hasPointers = structures.some((s) => (s.overlay?.pointers.length ?? 0) > 0);
  const hasGrid = structures.some((s) => s.view === "grid");
  const suppressLoopView =
    (hasPointers || hasGrid) && summary != null && (summary.kind === "iterative" || summary.kind === "nested-loop");
  const hasAlgoView = summary != null && ALGO_VIEW_KINDS.has(summary.kind) && !suppressLoopView;

  // When the algorithm view already draws the list, drop duplicate flat views.
  const shownStructures =
    summary != null && SUPPRESS_FLAT.has(summary.kind)
      ? structures.filter((s) => !NODE_VIEWS.has(s.view))
      : structures;

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-2.5 p-3">

        {/* support warnings — ran, but something may misbehave in the sandbox */}
        {warnings.length > 0 && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5">
            {warnings.map((w) => (
              <div key={w.title} className="flex items-start gap-1.5 text-xs">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
                <span>
                  <span className="font-medium text-amber-300">{w.title}</span>
                  <span className="text-muted-foreground"> — {w.detail}</span>
                </span>
              </div>
            ))}
          </div>
        )}

        {/* error */}
        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
              <TriangleAlert className="size-4" />
              {error.type}
              {error.line != null && (
                <span className="font-mono text-xs font-normal opacity-70">· line {error.line}</span>
              )}
            </div>
            <p className="mt-1 font-mono text-xs text-destructive/80 whitespace-pre-wrap">{error.message}</p>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              {explainException(error.type, error.message).hint}
            </p>
          </div>
        )}

        {/* algo badge */}
        {summary && <AlgoBadge kind={summary.kind} complexity={summary.complexity} />}

        {/* algorithm / wrapped-structure animation (one per program) */}
        {hasAlgoView && summary && <AutoViz kind={summary.kind} snapshots={snapshots} step={currentStep} />}

        {/* live data structures (per-variable, possibly several) */}
        <StructureList structures={shownStructures} snapshots={snapshots} step={currentStep} />

        {/* universal fallback — only when nothing else drew a view */}
        {!hasAlgoView && shownStructures.length === 0 && (
          <GenericViz snapshots={snapshots} step={currentStep} />
        )}

        {/* current step card */}
        {current && (
          <div className="rounded-md border border-border/50 bg-card/60 px-3 py-2.5">
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-full border border-border/50 bg-background px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                line {current.line}
              </span>
              <KindPill kind={current.kind} />
              <span className="ml-auto font-mono text-[10px] text-muted-foreground/40">
                {currentStep + 1} / {explanations.length}
              </span>
            </div>
            {current.detail && (
              <pre className="overflow-x-auto rounded bg-muted/40 px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground/80 whitespace-pre-wrap">
                {current.detail}
              </pre>
            )}
          </div>
        )}

        {/* variable diff */}
        <VariableDiff prev={prevSnap} curr={currSnap} />

      </div>
    </ScrollArea>
  );
}

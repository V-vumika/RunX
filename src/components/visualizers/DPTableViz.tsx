"use client";

import { Fragment, useMemo, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
} from "lucide-react";

import type { Snapshot, StackFrame, ValueNode } from "@/types/snapshot";
import { shortRepr, narrateStep } from "@/lib/explain/narrate";
import { useExecutionStore } from "@/lib/store/execution-store";

// ── data extraction ───────────────────────────────────────────────────────────

/** A 2D list (list of lists) as raw nodes — used for DP tables like dp[i][j]. */
function as2DNodes(node: ValueNode | undefined): ValueNode[][] | null {
  if (!node || node.kind !== "list" || !node.items) return null;
  const rows = node.items;
  if (rows.length === 0 || !rows.every((r) => r.kind === "list")) return null;
  return rows.map((r) => r.items ?? []);
}

/** A 1D list of scalars — used for DP arrays like dp[i]. */
function as1DNodes(node: ValueNode | undefined): ValueNode[] | null {
  if (!node || node.kind !== "list" || !node.items) return null;
  if (node.items.some((i) => i.kind === "list")) return null;
  return node.items;
}

/** Numeric value of a cell node, or null when it isn't a plain number. */
function num(node: ValueNode | undefined): number | null {
  if (!node) return null;
  if (node.kind === "int" || node.kind === "float") {
    const n = Number(node.value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Find the innermost frame holding a dp-like variable, and that variable. */
function findDp(frame: StackFrame | undefined, stack: StackFrame[] | undefined) {
  const frames = stack ?? (frame ? [frame] : []);
  for (let k = frames.length - 1; k >= 0; k--) {
    const v = frames[k].locals.find(
      (l) => /^dp$|^table$|^memo$|^cache$/.test(l.name) || /dp/i.test(l.name)
    );
    if (v && (as2DNodes(v.value) || as1DNodes(v.value))) return { frame: frames[k], dpVar: v };
  }
  return null;
}

/** The grid this variable held at the earliest step where it existed. */
function baselineGrid(snapshots: Snapshot[], step: number, name: string): string[][] | null {
  for (let s = 0; s <= step; s++) {
    const v = snapshots[s]?.stack.find((f) => f.locals.some((l) => l.name === name))
      ?.locals.find((l) => l.name === name);
    const g = as2DNodes(v?.value);
    if (g) return g.map((row) => row.map((c) => shortRepr(c, 5)));
  }
  return null;
}
function baselineRow(snapshots: Snapshot[], step: number, name: string): string[] | null {
  for (let s = 0; s <= step; s++) {
    const v = snapshots[s]?.stack.find((f) => f.locals.some((l) => l.name === name))
      ?.locals.find((l) => l.name === name);
    const g = as1DNodes(v?.value);
    if (g) return g.map((c) => shortRepr(c, 6));
  }
  return null;
}

// ── color coding ──────────────────────────────────────────────────────────────

interface Palette {
  bg: string;
  border: string;
  text: string;
  shadow: string;
}

const COLORS: Record<string, Palette> = {
  current: {
    bg: "rgba(245,185,66,0.22)",
    border: "#F5B942",
    text: "#FDE7BE",
    shadow: "0 6px 20px -4px rgba(245,185,66,0.5)",
  },
  dependency: {
    bg: "rgba(96,165,250,0.20)",
    border: "#60A5FA",
    text: "#D6E7FF",
    shadow: "0 6px 18px -6px rgba(96,165,250,0.55)",
  },
  computed: {
    bg: "rgba(45,212,191,0.13)",
    border: "rgba(45,212,191,0.5)",
    text: "#BDF3E7",
    shadow: "0 3px 10px -4px rgba(0,0,0,0.6)",
  },
  pending: {
    bg: "rgba(255,255,255,0.025)",
    border: "rgba(255,255,255,0.08)",
    text: "rgba(255,255,255,0.32)",
    shadow: "0 1px 4px rgba(0,0,0,0.35)",
  },
};

type CellState = keyof typeof COLORS;

const GLOW = [
  "0 6px 20px -4px rgba(245,185,66,0.35)",
  "0 8px 30px -2px rgba(245,185,66,0.7)",
  "0 6px 20px -4px rgba(245,185,66,0.35)",
];

// ── formula inference ─────────────────────────────────────────────────────────

interface Formula {
  formula: string;
  subst: string;
  plain: string;
}

/** Infer the recurrence from the current cell and its neighbours' values. */
function infer2D(cur: number, up: number | null, left: number | null, diag: number | null): Formula {
  const has = (x: number | null): x is number => x !== null;
  if (has(diag) && cur === diag + 1)
    return { formula: "dp[i][j] = dp[i-1][j-1] + 1", subst: `${diag} + 1 = ${cur}`,
      plain: `Characters matched — take the diagonal value (${diag}) and add 1.` };
  if (has(up) && has(left) && has(diag) && cur === Math.min(up, left, diag) + 1)
    return { formula: "dp[i][j] = 1 + min(↑, ←, ↖)", subst: `1 + min(${up}, ${left}, ${diag}) = ${cur}`,
      plain: `Chose the cheapest neighbouring edit (${Math.min(up, left, diag)}) and added 1.` };
  if (has(up) && has(left) && cur === Math.max(up, left) + 1)
    return { formula: "dp[i][j] = 1 + max(↑, ←)", subst: `1 + max(${up}, ${left}) = ${cur}`,
      plain: `Took the better neighbour (${Math.max(up, left)}) and added 1.` };
  if (has(up) && has(left) && cur === Math.max(up, left))
    return { formula: "dp[i][j] = max(↑, ←)", subst: `max(${up}, ${left}) = ${cur}`,
      plain: `Carried forward the better of the cell above (${up}) and the cell to the left (${left}).` };
  if (has(up) && has(left) && cur === up + left)
    return { formula: "dp[i][j] = ↑ + ←", subst: `${up} + ${left} = ${cur}`,
      plain: `Combined the ways from above (${up}) and from the left (${left}).` };
  const parts = [
    has(up) ? `↑=${up}` : null,
    has(left) ? `←=${left}` : null,
    has(diag) ? `↖=${diag}` : null,
  ].filter(Boolean).join(", ");
  return { formula: "dp[i][j] = f(↑, ←, ↖)", subst: parts ? `${parts} → ${cur}` : `= ${cur}`,
    plain: `Computed from its neighbouring cells${parts ? ` (${parts})` : ""}.` };
}

function infer1D(cur: number, p1: number | null, p2: number | null): Formula {
  const has = (x: number | null): x is number => x !== null;
  if (has(p1) && has(p2) && cur === p1 + p2)
    return { formula: "dp[i] = dp[i-1] + dp[i-2]", subst: `${p1} + ${p2} = ${cur}`,
      plain: `Added the two previous cells (${p1} + ${p2}).` };
  if (has(p1) && has(p2) && cur === Math.max(p1, p2))
    return { formula: "dp[i] = max(dp[i-1], dp[i-2])", subst: `max(${p1}, ${p2}) = ${cur}`,
      plain: `Kept the larger of the two previous cells.` };
  if (has(p1) && cur === p1 + 1)
    return { formula: "dp[i] = dp[i-1] + 1", subst: `${p1} + 1 = ${cur}`,
      plain: `One more than the previous cell (${p1}).` };
  const parts = [has(p1) ? `dp[i-1]=${p1}` : null, has(p2) ? `dp[i-2]=${p2}` : null]
    .filter(Boolean).join(", ");
  return { formula: "dp[i] = f(dp[i-1], dp[i-2])", subst: parts ? `${parts} → ${cur}` : `= ${cur}`,
    plain: `Computed from earlier cells${parts ? ` (${parts})` : ""}.` };
}

// ── cell ──────────────────────────────────────────────────────────────────────

function Cell({ val, state, size }: { val: string; state: CellState; size: number }) {
  const c = COLORS[state];
  const current = state === "current";
  return (
    <motion.div
      className="relative flex items-center justify-center overflow-hidden rounded-2xl border"
      style={{ width: size, height: size, borderWidth: 1.5 }}
      animate={{
        backgroundColor: c.bg,
        borderColor: c.border,
        borderStyle: state === "pending" ? "dashed" : "solid",
        scale: current ? 1.1 : 1,
        zIndex: current ? 5 : 1,
        boxShadow: current ? GLOW : c.shadow,
      }}
      transition={{
        default: { type: "spring", stiffness: 260, damping: 22 },
        boxShadow: current
          ? { repeat: Infinity, duration: 1.6, ease: "easeInOut" }
          : { duration: 0.3 },
      }}
    >
      {/* glossy top highlight for depth */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl"
        style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.08), transparent)" }}
      />
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={val}
          className="relative font-mono tabular-nums"
          style={{
            color: c.text,
            fontSize: size < 42 ? 12 : 14,
            fontWeight: current ? 700 : 500,
            textShadow: current ? "0 0 12px rgba(245,185,66,0.6)" : "none",
          }}
          initial={{ opacity: 0, y: -8, scale: 0.5, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 8, scale: 0.5, filter: "blur(4px)" }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
        >
          {val}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}

function HeaderChip({ children, size, active }: { children: ReactNode; size: number; active?: boolean }) {
  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <motion.span
        className="flex items-center justify-center rounded-lg font-mono text-[11px] font-semibold"
        style={{ minWidth: 22, height: 22, padding: "0 6px" }}
        animate={{
          backgroundColor: active ? "rgba(245,185,66,0.9)" : "rgba(255,255,255,0.05)",
          color: active ? "#1a1205" : "rgba(255,255,255,0.45)",
        }}
        transition={{ duration: 0.25 }}
      >
        {children}
      </motion.span>
    </div>
  );
}

function Legend({ state, label }: { state: CellState; label: string }) {
  const c = COLORS[state];
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="h-2.5 w-2.5 rounded-[4px] border"
        style={{ backgroundColor: c.bg, borderColor: c.border, borderStyle: state === "pending" ? "dashed" : "solid" }}
      />
      {label}
    </span>
  );
}

function ControlButton({
  onClick,
  disabled,
  label,
  primary,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  primary?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`flex items-center justify-center rounded-xl border backdrop-blur transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 ${
        primary
          ? "size-10 border-primary/40 bg-primary/20 text-primary shadow-lg shadow-primary/20 hover:bg-primary/30"
          : "size-9 border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export function DPTableViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const code = useExecutionStore((s) => s.code);
  const isPlaying = useExecutionStore((s) => s.isPlaying);
  const stepForward = useExecutionStore((s) => s.stepForward);
  const stepBackward = useExecutionStore((s) => s.stepBackward);
  const goToStep = useExecutionStore((s) => s.goToStep);
  const togglePlay = useExecutionStore((s) => s.togglePlay);
  const pause = useExecutionStore((s) => s.pause);

  const snap = snapshots[step];
  const found = findDp(snap?.stack.at(-1), snap?.stack);

  const narration = useMemo(() => {
    if (!snap) return null;
    return narrateStep(step > 0 ? snapshots[step - 1] : null, snap, code.split("\n"), "dp");
  }, [snapshots, step, code, snap]);

  if (!found) return null;
  const { frame, dpVar } = found;

  const i = Number(frame.locals.find((v) => v.name === "i")?.value.value ?? -1);
  const j = Number(frame.locals.find((v) => v.name === "j")?.value.value ?? -1);

  const grid = as2DNodes(dpVar.value);
  const row = as1DNodes(dpVar.value);

  const controls = (
    <div className="flex items-center justify-center gap-2.5">
      <ControlButton onClick={() => { pause(); goToStep(0); }} disabled={step <= 0} label="Reset to start">
        <RotateCcw className="size-4" />
      </ControlButton>
      <ControlButton onClick={stepBackward} disabled={step <= 0} label="Previous step">
        <SkipBack className="size-4" />
      </ControlButton>
      <ControlButton onClick={togglePlay} primary label={isPlaying ? "Pause" : "Play"}>
        {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 translate-x-[1px]" />}
      </ControlButton>
      <ControlButton onClick={stepForward} disabled={step >= snapshots.length - 1} label="Next step">
        <SkipForward className="size-4" />
      </ControlButton>
      <span className="ml-1.5 font-mono text-[11px] tabular-nums text-muted-foreground/60">
        {step + 1} <span className="opacity-40">/ {snapshots.length}</span>
      </span>
    </div>
  );

  const legend = (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[10px] text-muted-foreground">
      <Legend state="current" label="computing" />
      <Legend state="dependency" label="dependency" />
      <Legend state="computed" label="computed" />
      <Legend state="pending" label="unvisited" />
    </div>
  );

  const stepPanel = narration && (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-3 backdrop-blur">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="rounded-full border border-white/10 bg-background/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
          line {narration.line}
        </span>
        {i >= 0 && (
          <span className="rounded-full bg-[#F5B942]/15 px-2 py-0.5 font-mono text-[10px] text-[#FDE7BE]">
            i = {i}{j >= 0 ? `, j = ${j}` : ""}
          </span>
        )}
      </div>
      <p className="text-xs leading-relaxed text-foreground/85">{narration.text}</p>
    </div>
  );

  const formulaPanel = (formula: Formula | null) => (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur">
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70">
        <span className="h-1.5 w-1.5 rounded-full bg-[#F5B942]" />
        transition
      </div>
      {formula ? (
        <>
          <code className="block rounded-xl border border-[#F5B942]/20 bg-[#F5B942]/10 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-[#FDE7BE]">
            {formula.formula}
          </code>
          <div className="mt-2.5 font-mono text-[12px] font-medium text-blue-300/90">{formula.subst}</div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{formula.plain}</p>
        </>
      ) : (
        <p className="text-[11px] leading-relaxed text-muted-foreground/70">
          Step to a cell being computed to see its recurrence.
        </p>
      )}
      <div className="mt-3.5 border-t border-white/10 pt-2.5">{legend}</div>
    </div>
  );

  const shell = (title: string, meta: string, body: ReactNode, formula: Formula | null) => (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent backdrop-blur-xl">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-[#F5B942]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-10 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#F5B942] shadow-[0_0_8px_rgba(245,185,66,0.8)]" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-foreground/80">{title}</span>
          <span className="font-mono text-[11px] text-muted-foreground/70">{dpVar.name}</span>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground/60">
          {meta}
        </span>
      </div>

      <div className="relative flex flex-col gap-4 p-4 lg:flex-row">
        <div className="min-w-0 flex-1 overflow-auto">{body}</div>
        <div className="shrink-0 lg:w-60">{formulaPanel(formula)}</div>
      </div>

      <div className="relative flex flex-col gap-3 border-t border-white/10 px-4 py-3.5">
        {stepPanel}
        {controls}
      </div>
    </div>
  );

  // ── 2D matrix ───────────────────────────────────────────────────────────────
  if (grid) {
    const rows = grid.length;
    const cols = Math.max(...grid.map((r) => r.length));
    const size = Math.max(44, Math.min(62, Math.floor(420 / Math.max(cols, 1))));
    const head = Math.round(size * 0.62);
    const gap = 10;
    const totalW = head + cols * (size + gap);
    const totalH = head + rows * (size + gap);

    const base = baselineGrid(snapshots, step, dpVar.name);
    const hasCurrent = i >= 0 && j >= 0 && i < rows && j < (grid[i]?.length ?? 0);

    const depCoords = [[-1, 0], [0, -1], [-1, -1]] as const;
    const deps = new Set<string>();
    if (hasCurrent) {
      for (const [dr, dc] of depCoords) {
        const r = i + dr, c = j + dc;
        if (r >= 0 && c >= 0 && r < rows && c < (grid[r]?.length ?? 0)) deps.add(`${r},${c}`);
      }
    }

    const stateOf = (r: number, c: number, val: string): CellState => {
      if (r === i && c === j) return "current";
      if (deps.has(`${r},${c}`)) return "dependency";
      const b = base?.[r]?.[c];
      return b === undefined || b !== val ? "computed" : "pending";
    };

    const cx = (c: number) => head + gap + c * (size + gap) + size / 2;
    const cy = (r: number) => head + gap + r * (size + gap) + size / 2;

    const curNum = hasCurrent ? num(grid[i]?.[j]) : null;
    const up = hasCurrent ? num(grid[i - 1]?.[j]) : null;
    const left = hasCurrent ? num(grid[i]?.[j - 1]) : null;
    const diag = hasCurrent ? num(grid[i - 1]?.[j - 1]) : null;
    const formula = curNum !== null ? infer2D(curNum, up, left, diag) : null;

    const body = (
      <div className="relative mx-auto" style={{ width: totalW, height: totalH }}>
        {/* crosshair highlight bands over active row/column */}
        {j >= 0 && j < cols && (
          <motion.div
            className="pointer-events-none absolute top-0 rounded-2xl bg-[#F5B942]/[0.06]"
            style={{ width: size + gap, height: totalH }}
            animate={{ left: head + gap + j * (size + gap) - gap / 2 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          />
        )}
        {i >= 0 && i < rows && (
          <motion.div
            className="pointer-events-none absolute left-0 rounded-2xl bg-[#F5B942]/[0.06]"
            style={{ width: totalW, height: size + gap }}
            animate={{ top: head + gap + i * (size + gap) - gap / 2 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          />
        )}

        {/* dependency arrows */}
        <svg className="pointer-events-none absolute inset-0 z-20" width={totalW} height={totalH}>
          <defs>
            <marker id="dp-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3"
              orient="auto" markerUnits="userSpaceOnUse">
              <path d="M0,0 L6.5,3 L0,6 Z" fill="#60A5FA" />
            </marker>
          </defs>
          {hasCurrent && [...deps].map((key) => {
            const [r, c] = key.split(",").map(Number);
            const x1 = cx(c), y1 = cy(r), x2 = cx(j), y2 = cy(i);
            const dx = x2 - x1, dy = y2 - y1;
            const len = Math.hypot(dx, dy) || 1;
            const pad = size * 0.44;
            return (
              <motion.line
                key={`${step}-${key}`}
                x1={x1 + (dx / len) * pad}
                y1={y1 + (dy / len) * pad}
                x2={x2 - (dx / len) * pad}
                y2={y2 - (dy / len) * pad}
                stroke="#60A5FA"
                strokeWidth={2}
                strokeLinecap="round"
                markerEnd="url(#dp-arrow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.95 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            );
          })}
        </svg>

        {/* grid */}
        <div
          className="relative z-10 grid"
          style={{
            gap,
            gridTemplateColumns: `${head}px repeat(${cols}, ${size}px)`,
            gridTemplateRows: `${head}px repeat(${rows}, ${size}px)`,
          }}
        >
          <div className="flex items-center justify-center font-mono text-[10px] text-muted-foreground/30" style={{ width: head, height: head }}>
            i\j
          </div>
          {Array.from({ length: cols }).map((_, c) => (
            <HeaderChip key={`ch-${c}`} size={size} active={c === j}>{c}</HeaderChip>
          ))}
          {grid.map((gr, r) => (
            <Fragment key={r}>
              <HeaderChip size={head} active={r === i}>{r}</HeaderChip>
              {Array.from({ length: cols }).map((_, c) => {
                const val = gr[c] ? shortRepr(gr[c], 5) : "";
                return <Cell key={`${r}-${c}`} val={val} size={size} state={stateOf(r, c, val)} />;
              })}
            </Fragment>
          ))}
        </div>
      </div>
    );

    return shell("dp table", `${rows} × ${cols}`, body, formula);
  }

  // ── 1D array ────────────────────────────────────────────────────────────────
  if (row) {
    const count = row.length;
    const size = Math.max(44, Math.min(60, Math.floor(440 / Math.max(count, 1))));
    const base = baselineRow(snapshots, step, dpVar.name);
    const hasCurrent = i >= 0 && i < count;
    const deps = new Set<number>();
    if (hasCurrent) for (const d of [i - 1, i - 2]) if (d >= 0) deps.add(d);

    const stateOf = (idx: number, val: string): CellState => {
      if (idx === i) return "current";
      if (deps.has(idx)) return "dependency";
      const b = base?.[idx];
      return b === undefined || b !== val ? "computed" : "pending";
    };

    const curNum = hasCurrent ? num(row[i]) : null;
    const p1 = hasCurrent ? num(row[i - 1]) : null;
    const p2 = hasCurrent ? num(row[i - 2]) : null;
    const formula = curNum !== null ? infer1D(curNum, p1, p2) : null;

    const body = (
      <div className="mx-auto inline-flex flex-col gap-2">
        <div className="flex gap-2.5">
          {row.map((cell, idx) => {
            const val = shortRepr(cell, 6);
            return <Cell key={idx} val={val} size={size} state={stateOf(idx, val)} />;
          })}
        </div>
        <div className="flex gap-2.5">
          {row.map((_, idx) => (
            <HeaderChip key={idx} size={size} active={idx === i}>{idx}</HeaderChip>
          ))}
        </div>
      </div>
    );

    return shell("dp array", `${count} cells`, body, formula);
  }

  return null;
}

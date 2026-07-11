"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BarChart3, GitBranch, Share2, Search } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Pill, GradientText, SectionGlow } from "./kit";

/**
 * Shows the breadth of RunX's auto-selected views: shadcn Tabs switch between
 * live, self-playing mini-visualizers (a sorting pass, a tree BFS, a graph
 * traversal, a binary search) so the promise "it picks the right view" is felt,
 * not just claimed.
 */
export function VisualizerShowcase() {
  return (
    <section id="showcase" className="relative scroll-mt-20 border-t border-[rgba(186,215,247,0.07)]">
      <SectionGlow />
      <div className="mx-auto max-w-6xl px-6 py-28 sm:py-32">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center">
            <Pill>Every structure</Pill>
          </div>
          <h2 className="mt-6 font-display text-4xl font-medium leading-[1.1] tracking-tight text-frost sm:text-5xl">
            Paste any algorithm. RunX picks the <GradientText className="font-medium">right view</GradientText>.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-mist sm:text-lg">
            A classifier reads your code and its trace, then opens the visualizer that fits — no annotations, no setup.
          </p>
        </motion.div>

        <motion.div
          className="mt-14"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
        >
          <Tabs defaultValue="sort" className="items-center gap-8">
            <TabsList className="h-auto rounded-full border border-hairline bg-[rgba(186,214,247,0.04)] p-1 backdrop-blur-sm">
              {TAB_META.map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="gap-1.5 rounded-full px-4 py-2 text-mist data-[state=active]:border-[rgba(155,140,247,0.3)] data-[state=active]:bg-[rgba(102,58,243,0.16)] data-[state=active]:text-[#cdbffb] data-[state=active]:shadow-none"
                >
                  <Icon className="size-4" strokeWidth={1.5} />
                  <span className="hidden sm:inline">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="w-full">
              <TabsContent value="sort">
                <PreviewShell caption="Bubble sort — comparing adjacent bars and swapping the larger one up.">
                  <SortPreview />
                </PreviewShell>
              </TabsContent>
              <TabsContent value="tree">
                <PreviewShell caption="Breadth-first traversal — visiting a binary tree level by level.">
                  <TraversalPreview nodes={TREE_NODES} edges={TREE_EDGES} order={[0, 1, 2, 3, 4, 5, 6]} />
                </PreviewShell>
              </TabsContent>
              <TabsContent value="graph">
                <PreviewShell caption="Graph traversal — the frontier expanding out from the start node.">
                  <TraversalPreview nodes={GRAPH_NODES} edges={GRAPH_EDGES} order={[0, 1, 2, 3, 4, 5]} />
                </PreviewShell>
              </TabsContent>
              <TabsContent value="search">
                <PreviewShell caption="Binary search — halving the window until the target is found.">
                  <SearchPreview />
                </PreviewShell>
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>
      </div>
    </section>
  );
}

const TAB_META = [
  { value: "sort", label: "Sorting", icon: BarChart3 },
  { value: "tree", label: "Trees", icon: GitBranch },
  { value: "graph", label: "Graphs", icon: Share2 },
  { value: "search", label: "Search", icon: Search },
] as const;

function PreviewShell({ children, caption }: { children: React.ReactNode; caption: string }) {
  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-[rgba(186,215,247,0.1)] bg-[#0a0e1c]/70 backdrop-blur-sm">
      <div className="flex h-64 items-center justify-center px-6">{children}</div>
      <p className="border-t border-[rgba(186,215,247,0.08)] bg-[rgba(199,211,234,0.03)] px-5 py-3 text-center font-mono text-[12px] text-fog">
        {caption}
      </p>
    </div>
  );
}

/* ── Sorting: a real, looping bubble-sort pass with sliding bars ─────────── */

const START = [46, 18, 72, 30, 60, 12, 52, 38];

function SortPreview() {
  const reduce = useReducedMotion();
  const [items, setItems] = useState(() => START.map((v, id) => ({ id, v })));
  const [cmp, setCmp] = useState<[number, number]>([0, 1]);
  const st = useRef({ i: 0, j: 0 });

  useEffect(() => {
    if (reduce) return;
    const tick = setInterval(() => {
      setItems((prev) => {
        const arr = [...prev];
        const { i, j } = st.current;
        setCmp([j, j + 1]);
        if (arr[j].v > arr[j + 1].v) [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        let nj = j + 1;
        let ni = i;
        if (nj >= arr.length - 1 - i) {
          nj = 0;
          ni = i + 1;
        }
        if (ni >= arr.length - 1) {
          ni = 0;
          nj = 0;
          st.current = { i: 0, j: 0 };
          return START.map((v, id) => ({ id, v })).sort(() => Math.random() - 0.5);
        }
        st.current = { i: ni, j: nj };
        return arr;
      });
    }, 700);
    return () => clearInterval(tick);
  }, [reduce]);

  return (
    <div className="flex h-40 items-end gap-2">
      {items.map((it, idx) => {
        const active = idx === cmp[0] || idx === cmp[1];
        return (
          <motion.div
            key={it.id}
            layout
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`w-6 rounded-t-md ${active ? "bg-linear-to-t from-void-violet to-[#9b8cf7]" : "bg-[rgba(199,211,234,0.14)]"}`}
            style={{ height: `${it.v * 1.6}px` }}
          />
        );
      })}
    </div>
  );
}

/* ── Traversal: highlight nodes in sequence over an SVG graph/tree ───────── */

type N = { id: number; x: number; y: number };

const TREE_NODES: N[] = [
  { id: 0, x: 130, y: 24 },
  { id: 1, x: 74, y: 72 },
  { id: 2, x: 186, y: 72 },
  { id: 3, x: 44, y: 120 },
  { id: 4, x: 104, y: 120 },
  { id: 5, x: 156, y: 120 },
  { id: 6, x: 216, y: 120 },
];
const TREE_EDGES: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6],
];

const GRAPH_NODES: N[] = [
  { id: 0, x: 40, y: 72 },
  { id: 1, x: 104, y: 30 },
  { id: 2, x: 104, y: 116 },
  { id: 3, x: 170, y: 30 },
  { id: 4, x: 170, y: 116 },
  { id: 5, x: 224, y: 72 },
];
const GRAPH_EDGES: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5], [1, 2],
];

function TraversalPreview({ nodes, edges, order }: { nodes: N[]; edges: [number, number][]; order: number[] }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(reduce ? order.length : 1);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setStep((s) => (s >= order.length ? 1 : s + 1)), 650);
    return () => clearInterval(id);
  }, [reduce, order.length]);

  const visited = new Set(order.slice(0, step));
  const current = order[step - 1];

  return (
    <svg viewBox="0 0 264 144" className="h-full w-full max-w-md">
      {edges.map(([a, b], i) => {
        const na = nodes[a];
        const nb = nodes[b];
        const on = visited.has(a) && visited.has(b);
        return (
          <line
            key={i}
            x1={na.x}
            y1={na.y}
            x2={nb.x}
            y2={nb.y}
            stroke={on ? "rgba(155,140,247,0.6)" : "rgba(186,215,247,0.14)"}
            strokeWidth={on ? 2 : 1}
            className="transition-all duration-300"
          />
        );
      })}
      {nodes.map((n) => {
        const isVisited = visited.has(n.id);
        const isCurrent = n.id === current;
        return (
          <g key={n.id}>
            {isCurrent && (
              <motion.circle
                cx={n.x}
                cy={n.y}
                r={14}
                fill="none"
                stroke="rgba(155,140,247,0.65)"
                initial={{ r: 12, opacity: 0.7 }}
                animate={{ r: 20, opacity: 0 }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            <motion.circle
              cx={n.x}
              cy={n.y}
              r={12}
              className="transition-colors duration-300"
              fill={isVisited ? "rgba(102,58,243,0.22)" : "rgba(199,211,234,0.05)"}
              stroke={isCurrent ? "#9b8cf7" : isVisited ? "rgba(155,140,247,0.5)" : "rgba(186,215,247,0.2)"}
              strokeWidth={isCurrent ? 2 : 1}
            />
            <text
              x={n.x}
              y={n.y + 3.5}
              textAnchor="middle"
              className="fill-mist font-mono"
              style={{ fontSize: 9 }}
            >
              {n.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Binary search: window halving over a row of cells ──────────────────── */

const NUMS = [3, 7, 11, 16, 22, 27, 34, 41, 50, 63];
const FRAMES = [
  { lo: 0, hi: 9, mid: 4 },
  { lo: 5, hi: 9, mid: 7 },
  { lo: 5, hi: 6, mid: 5 },
  { lo: 6, hi: 6, mid: 6, found: true },
];

function SearchPreview() {
  const reduce = useReducedMotion();
  const [f, setF] = useState(reduce ? FRAMES.length - 1 : 0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setF((p) => (p + 1) % FRAMES.length), 1100);
    return () => clearInterval(id);
  }, [reduce]);

  const fr = FRAMES[f];
  return (
    <div className="flex gap-1.5">
      {NUMS.map((n, i) => {
        const inWin = i >= fr.lo && i <= fr.hi;
        const isMid = i === fr.mid;
        const found = fr.found && isMid;
        return (
          <motion.div
            key={i}
            animate={{ scale: isMid ? 1.1 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className={`flex size-8 items-center justify-center rounded-md border text-[12px] font-medium transition-colors duration-300 ${
              found
                ? "border-[#7fd7c0]/70 bg-[#7fd7c0]/20 text-[#a9ecd8]"
                : isMid
                  ? "border-[rgba(155,140,247,0.7)] bg-[rgba(102,58,243,0.2)] text-[#cdbffb]"
                  : inWin
                    ? "border-[rgba(186,215,247,0.15)] bg-[rgba(199,211,234,0.06)] text-mist"
                    : "border-[rgba(186,215,247,0.06)] bg-transparent text-fog/60"
            }`}
          >
            {n}
          </motion.div>
        );
      })}
    </div>
  );
}

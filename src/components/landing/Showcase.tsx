import { ArrowUpDown, Share2, TreePine, Table2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Group {
  icon: LucideIcon;
  label: string;
  items: string[];
}

const GROUPS: Group[] = [
  {
    icon: ArrowUpDown,
    label: "Sorting & searching",
    items: ["Bubble Sort", "Merge Sort", "Quick Sort", "Binary Search", "Sliding window", "Two pointers"],
  },
  {
    icon: Share2,
    label: "Graphs",
    items: ["BFS", "DFS", "Dijkstra", "Grid / Islands", "Union-Find"],
  },
  {
    icon: TreePine,
    label: "Trees & links",
    items: ["Binary Tree", "Trie", "Linked List", "Heap", "Segment Tree", "Fenwick Tree"],
  },
  {
    icon: Table2,
    label: "Tables & counting",
    items: ["DP table", "Hash map", "Counter", "Intervals", "Bitmask", "Set"],
  },
];

/**
 * Breadth section — the range of structures RunX recognises straight from your
 * code, so the reader sees this isn't one demo but a general tool.
 */
export function Showcase() {
  return (
    <section id="showcase" className="scroll-mt-8 border-y border-border/60 bg-muted/20">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
        <div className="max-w-2xl">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Paste any algorithm.{" "}
            <span className="text-violet-400">RunX picks the right view.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            A classifier reads your code and its trace, then opens the visualizer that fits —
            no annotations, no configuration.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GROUPS.map(({ icon: Icon, label, items }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2.5">
                <Icon className="size-4 text-violet-300" />
                <h3 className="text-sm font-semibold tracking-tight">{label}</h3>
              </div>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {items.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-border/70 bg-muted/30 px-2 py-1 font-mono text-[11px] text-muted-foreground"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center font-mono text-xs text-muted-foreground/70">
          …and a rich fallback view for everything else — nothing runs and shows nothing.
        </p>
      </div>
    </section>
  );
}

import { ArrowUpDown, Share2, TreePine, Table2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { SectionHeading } from "./authkit/SectionHeading";
import { GlassCard } from "./authkit/GlassCard";

const GROUPS: { icon: LucideIcon; label: string; items: string[] }[] = [
  {
    icon: ArrowUpDown,
    label: "Sorting and searching",
    items: ["Bubble Sort", "Merge Sort", "Quick Sort", "Binary Search", "Sliding window", "Two pointers"],
  },
  {
    icon: Share2,
    label: "Graphs",
    items: ["BFS", "DFS", "Dijkstra", "Grid and islands", "Union find"],
  },
  {
    icon: TreePine,
    label: "Trees and links",
    items: ["Binary Tree", "Trie", "Linked List", "Heap", "Segment Tree", "Fenwick Tree"],
  },
  {
    icon: Table2,
    label: "Tables and counting",
    items: ["DP table", "Hash map", "Counter", "Intervals", "Bitmask", "Set"],
  },
];

/** The breadth of structures RunX recognises straight from your code. */
export function Showcase() {
  return (
    <section id="showcase" className="scroll-mt-8 border-y border-[rgba(186,215,247,0.08)]">
      <div className="mx-auto max-w-6xl px-6 py-28">
        <SectionHeading
          eyebrow="Every structure"
          title={
            <>
              Paste any algorithm.
              <br />
              RunX picks the right view.
            </>
          }
          body="A classifier reads your code and its trace, then opens the visualizer that fits. No annotations, no configuration, nothing to set up."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GROUPS.map(({ icon: Icon, label, items }) => (
            <GlassCard key={label} className="p-5">
              <div className="flex items-center gap-2.5">
                <Icon className="size-4 text-[#b8a9fb]" strokeWidth={1.5} />
                <h3 className="font-display text-sm font-medium tracking-tight text-frost">{label}</h3>
              </div>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {items.map((item) => (
                  <li
                    key={item}
                    className="ak-hairline rounded-md bg-[rgba(199,211,234,0.05)] px-2 py-1 font-mono text-[11px] text-mist"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </GlassCard>
          ))}
        </div>

        <p className="mt-10 text-center font-mono text-[13px] text-fog">
          and a rich fallback view for everything else, so nothing ever runs and shows nothing.
        </p>
      </div>
    </section>
  );
}

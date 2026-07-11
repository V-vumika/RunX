"use client";

import { INTERVIEW_PROBLEMS } from "@/lib/interview/problems";

const DIFFICULTY_DOT: Record<string, string> = {
  Easy: "bg-emerald-500",
  Medium: "bg-amber-500",
};

export function ProblemPicker({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
      {INTERVIEW_PROBLEMS.map((p) => {
        const active = p.id === activeId;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
              active
                ? "border-void-violet/40 bg-void-violet/15 text-foreground"
                : "border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground"
            }`}
            title={`${p.title} (${p.difficulty})`}
          >
            <span className={`size-1.5 rounded-full ${DIFFICULTY_DOT[p.difficulty]}`} />
            {p.title}
          </button>
        );
      })}
    </div>
  );
}

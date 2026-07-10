"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { useExecutionStore } from "@/lib/store/execution-store";
import type { Language } from "@/lib/execution/entry";

/**
 * Language picker for the editor panel header. Python and JavaScript are
 * runnable today; C / C++ / Java are shown but disabled ("Coming Soon") until
 * their execution providers land (Judge0, see lib/execution/providers.ts).
 * Selecting a language goes through the store's setLanguage, which swaps the
 * per-language code buffer and engine.
 */

interface LangOption {
  /** Store language id; display-only entries (no engine planned id yet) use null. */
  id: Language | null;
  label: string;
  icon: string;
  comingSoon?: boolean;
}

const OPTIONS: LangOption[] = [
  { id: "python", label: "Python", icon: "🐍" },
  { id: "javascript", label: "JavaScript", icon: "🟨" },
  { id: null, label: "C", icon: "⚡", comingSoon: true },
  { id: "cpp", label: "C++", icon: "⚡", comingSoon: true },
  { id: "java", label: "Java", icon: "☕", comingSoon: true },
];

export function LanguageSelector() {
  const language = useExecutionStore((s) => s.language);
  const setLanguage = useExecutionStore((s) => s.setLanguage);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const current = OPTIONS.find((o) => o.id === language) ?? OPTIONS[0];

  // Close on any click outside the selector.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Choose language"
        className="flex items-center gap-1.5 rounded bg-muted/70 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <span aria-hidden>{current.icon}</span>
        <span className="font-medium">{current.label}</span>
        <ChevronDown className={`size-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-md border border-border/60 bg-popover shadow-lg">
          {OPTIONS.map((o) => {
            const active = o.id === language;
            return (
              <button
                key={o.label}
                type="button"
                disabled={o.comingSoon}
                onClick={() => {
                  if (o.id && !o.comingSoon) setLanguage(o.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors ${
                  o.comingSoon
                    ? "cursor-not-allowed text-muted-foreground/40"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <span aria-hidden>{o.icon}</span>
                <span className={active ? "font-medium" : ""}>{o.label}</span>
                {o.comingSoon && (
                  <span className="ml-auto rounded bg-muted/60 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted-foreground/60">
                    Coming Soon
                  </span>
                )}
                {active && <Check className="ml-auto size-3 text-emerald-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

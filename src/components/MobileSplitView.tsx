"use client";

import { useState, type ReactNode } from "react";
import { Code2, PanelBottom } from "lucide-react";

/**
 * Mobile layout for the editor + result-tabs split. A fixed 50/50 vh split
 * left both halves cramped on a phone — especially interview mode, which
 * squeezes four tabs (Problem/Explain/Complexity/Output) into that bottom
 * half. Instead, a small toggle lets the user give one side the room (72vh)
 * while the other stays a reachable peek (28vh) — one tap to swap focus,
 * rather than permanently hiding either side.
 */
export function MobileSplitView({ editor, result }: { editor: ReactNode; result: ReactNode }) {
  const [focus, setFocus] = useState<"editor" | "result">("editor");

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex shrink-0 gap-1 border-b border-[rgba(186,215,247,0.08)] bg-[rgba(186,214,247,0.02)] p-1.5">
        <FocusButton active={focus === "editor"} onClick={() => setFocus("editor")} icon={Code2}>
          Code
        </FocusButton>
        <FocusButton active={focus === "result"} onClick={() => setFocus("result")} icon={PanelBottom}>
          Result
        </FocusButton>
      </div>

      <div
        className={`flex shrink-0 flex-col overflow-hidden border-b border-[rgba(186,215,247,0.08)] transition-[height] duration-200 ${
          focus === "editor" ? "h-[72vh]" : "h-[26vh]"
        }`}
      >
        {editor}
      </div>

      <div className={`shrink-0 overflow-hidden transition-[height] duration-200 ${focus === "result" ? "h-[72vh]" : "h-[26vh]"}`}>
        {result}
      </div>
    </div>
  );
}

function FocusButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Code2;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border border-[rgba(155,140,247,0.3)] bg-[rgba(102,58,243,0.16)] text-[#cdbffb]"
          : "border border-transparent text-mist hover:text-frost"
      }`}
    >
      <Icon className="size-3.5" />
      {children}
    </button>
  );
}

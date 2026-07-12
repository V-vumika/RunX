"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Check, ClipboardPaste, Copy, Trash2, X } from "lucide-react";
import type { BeforeMount, OnMount, Monaco } from "@monaco-editor/react";
import type { editor as MonacoEditorNS } from "monaco-editor";

import {
  selectCurrentSnapshot,
  useExecutionStore,
} from "@/lib/store/execution-store";

/**
 * Clipboard copy fallback for insecure contexts (e.g. the dev server's http
 * network URL) where navigator.clipboard is unavailable. Uses a throwaway
 * textarea + execCommand. Deprecated but still widely supported.
 */
function legacyCopy(text: string): boolean {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Custom theme so the editor's chrome (background, gutter, selection, cursor)
 * matches the app's navy/frost/periwinkle palette instead of Monaco's stock
 * `vs-dark` (VS Code's own blue-gray) — the seam between "the editor" and
 * "the rest of the product" was one of the more obvious visual mismatches.
 * Syntax token colors are inherited from vs-dark (`base`/`inherit: true`) —
 * only the surrounding chrome is restyled, so highlighting stays legible and
 * familiar.
 */
const handleBeforeMount: BeforeMount = (monaco) => {
  monaco.editor.defineTheme("runx-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#0a0e1c",
      "editor.foreground": "#d1e4fa",
      "editorLineNumber.foreground": "#4a5578",
      "editorLineNumber.activeForeground": "#9b8cf7",
      "editorCursor.foreground": "#9b8cf7",
      "editor.selectionBackground": "#663af359",
      "editor.inactiveSelectionBackground": "#663af333",
      "editor.lineHighlightBackground": "#bad7f70a",
      "editorIndentGuide.background1": "#bad7f714",
      "editorIndentGuide.activeBackground1": "#bad7f72e",
      "editorGutter.background": "#0a0e1c",
      "editorWidget.background": "#0c1122",
      "editorWidget.border": "#bad7f71f",
      "editorSuggestWidget.background": "#0c1122",
      "editorSuggestWidget.border": "#bad7f71f",
      "editorSuggestWidget.selectedBackground": "#663af326",
      "scrollbarSlider.background": "#bad7f714",
      "scrollbarSlider.hoverBackground": "#bad7f722",
      "scrollbarSlider.activeBackground": "#bad7f733",
      "minimap.background": "#0a0e1c",
    },
  });
};

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.Editor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading editor…
      </div>
    ),
  }
);

export function CodeEditor() {
  const code = useExecutionStore((s) => s.code);
  const setCode = useExecutionStore((s) => s.setCode);
  const language = useExecutionStore((s) => s.language);
  const snapshot = useExecutionStore(selectCurrentSnapshot);
  const hasTrace = useExecutionStore((s) => s.snapshots.length > 0);

  // Monaco language id for syntax highlighting; only runnable languages appear
  // in the selector, so this stays a simple two-way map for now.
  const monacoLanguage = language === "javascript" ? "javascript" : "python";

  const editorRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef =
    useRef<MonacoEditorNS.IEditorDecorationsCollection | null>(null);

  const [copyState, setCopyState] = useState<"idle" | "ok" | "fail">("idle");
  const [pasteHint, setPasteHint] = useState(false);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    decorationsRef.current = editor.createDecorationsCollection();

    // Ensure paste always works — explicitly bind Ctrl+V / Cmd+V
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
      editor.trigger("keyboard", "editor.action.clipboardPasteAction", null);
    });

    // Ctrl/Cmd+Enter runs the code, even while typing in the editor.
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      useExecutionStore.getState().run();
    });
  };

  // Copy the whole program to the clipboard, with a fallback for insecure
  // contexts where navigator.clipboard is unavailable.
  async function handleCopy() {
    const text = editorRef.current?.getValue() ?? code;
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        ok = true;
      } else {
        ok = legacyCopy(text);
      }
    } catch {
      ok = legacyCopy(text);
    }
    setCopyState(ok ? "ok" : "fail");
    setTimeout(() => setCopyState("idle"), 1400);
  }

 
  async function handlePaste() {
    const editor = editorRef.current;
    const insert = (text: string) => {
      if (!text) return;
      if (editor) {
        const range = editor.getSelection() ?? editor.getModel()?.getFullModelRange();
        if (range) {
          editor.executeEdits("runx-paste", [{ range, text, forceMoveMarkers: true }]);
          editor.focus();
        }
      } else {
        setCode(code + text);
      }
    };

    if (!navigator.clipboard?.readText) {
      editor?.focus();
      setPasteHint(true);
      setTimeout(() => setPasteHint(false), 2200);
      return;
    }
    try {
      insert(await navigator.clipboard.readText());
    } catch {
      editor?.focus();
      setPasteHint(true);
      setTimeout(() => setPasteHint(false), 2200);
    }
  }

  // Wipe the editor to an empty program. Clears the model directly so the
  // change flows through onChange → setCode like any other edit.
  function handleClear() {
    const editor = editorRef.current;
    if (editor) {
      editor.setValue("");
      editor.focus();
    } else {
      setCode("");
    }
  }

  // Highlight (and scroll to) the line about to execute for the current step.
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const collection = decorationsRef.current;
    if (!editor || !monaco || !collection) return;

    const line = hasTrace ? snapshot?.line : undefined;
    if (!line) {
      collection.clear();
      return;
    }

    collection.set([
      {
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: "runx-current-line",
          glyphMarginClassName: "runx-current-line-glyph",
        },
      },
    ]);
    editor.revealLineInCenterIfOutsideViewport(line);
  }, [snapshot, hasTrace]);

  return (
    <div className="relative h-full">
      {/* One cohesive frosted toolbar (divided, not three floating pills) —
          matches the glass/hairline language used across the rest of the app. */}
      <div className="ak-glass ak-hairline absolute right-3 top-2 z-10 flex overflow-hidden rounded-lg backdrop-blur-md">
        <button
          onClick={handleCopy}
          title="Copy all code"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] transition-colors hover:bg-[rgba(186,214,247,0.08)] hover:text-frost ${
            copyState === "fail" ? "text-destructive" : "text-mist"
          }`}
        >
          {copyState === "ok" ? (
            <Check className="size-3" />
          ) : copyState === "fail" ? (
            <X className="size-3" />
          ) : (
            <Copy className="size-3" />
          )}
          {copyState === "ok" ? "Copied" : copyState === "fail" ? "Failed" : "Copy"}
        </button>
        <span className="w-px shrink-0 bg-[rgba(186,215,247,0.1)]" />
        <button
          onClick={handlePaste}
          title="Paste from clipboard at the cursor"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-mist transition-colors hover:bg-[rgba(186,214,247,0.08)] hover:text-frost"
        >
          <ClipboardPaste className="size-3" />
          {pasteHint ? "Press Ctrl+V" : "Paste"}
        </button>
        <span className="w-px shrink-0 bg-[rgba(186,215,247,0.1)]" />
        <button
          onClick={handleClear}
          title="Clear all code"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-mist transition-colors hover:bg-[rgba(186,214,247,0.08)] hover:text-frost"
        >
          <Trash2 className="size-3" />
          Clear
        </button>
      </div>
      <MonacoEditor
      height="100%"
      language={monacoLanguage}
      theme="runx-dark"
      value={code}
      onChange={(value) => setCode(value ?? "")}
      beforeMount={handleBeforeMount}
      onMount={handleMount}
      options={{
        fontSize: 14,
        fontFamily:
          "var(--font-jetbrains), ui-monospace, SFMono-Regular, monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        glyphMargin: true,
        smoothScrolling: true,
        tabSize: 4,
        renderLineHighlight: "none",
        padding: { top: 12, bottom: 12 },
        readOnly: false,
        domReadOnly: false,
      }}
      />
    </div>
  );
}

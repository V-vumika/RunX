"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Check, ClipboardPaste, Copy, X } from "lucide-react";
import type { OnMount, Monaco } from "@monaco-editor/react";
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
  const snapshot = useExecutionStore(selectCurrentSnapshot);
  const hasTrace = useExecutionStore((s) => s.snapshots.length > 0);

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
      <div className="absolute right-3 top-2 z-10 flex gap-1">
        <button
          onClick={handleCopy}
          title="Copy all code"
          className={`flex items-center gap-1 rounded bg-muted/70 px-2 py-1 text-[11px] backdrop-blur transition-colors hover:bg-muted hover:text-foreground ${
            copyState === "fail" ? "text-destructive" : "text-muted-foreground"
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
        <button
          onClick={handlePaste}
          title="Paste from clipboard at the cursor"
          className="flex items-center gap-1 rounded bg-muted/70 px-2 py-1 text-[11px] text-muted-foreground backdrop-blur transition-colors hover:bg-muted hover:text-foreground"
        >
          <ClipboardPaste className="size-3" />
          {pasteHint ? "Press Ctrl+V" : "Paste"}
        </button>
      </div>
      <MonacoEditor
      height="100%"
      defaultLanguage="python"
      theme="vs-dark"
      value={code}
      onChange={(value) => setCode(value ?? "")}
      onMount={handleMount}
      options={{
        fontSize: 14,
        fontFamily:
          "var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace",
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

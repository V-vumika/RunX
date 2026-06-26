"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { OnMount, Monaco } from "@monaco-editor/react";
import type { editor as MonacoEditorNS } from "monaco-editor";

import {
  selectCurrentSnapshot,
  useExecutionStore,
} from "@/lib/store/execution-store";

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

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    decorationsRef.current = editor.createDecorationsCollection();

    // Ensure paste always works — explicitly bind Ctrl+V / Cmd+V
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
      editor.trigger("keyboard", "editor.action.clipboardPasteAction", null);
    });
  };

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
  );
}

"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { BriefcaseBusiness, ScanSearch } from "lucide-react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { LanguageSelector } from "@/components/editor/LanguageSelector";
import { ShareButton } from "@/components/ShareButton";
import { MobileSplitView } from "@/components/MobileSplitView";
import { decodeShare } from "@/lib/share";
import { ExecutionControls } from "@/components/execution/ExecutionControls";
import { OutputPanel } from "@/components/execution/OutputPanel";
import { InputsPanel } from "@/components/execution/InputsPanel";
import { StdinPanel } from "@/components/execution/StdinPanel";
import { ExplainPanel } from "@/components/explain/ExplainPanel";
import { ComplexityPanel } from "@/components/explain/ComplexityPanel";
import { useExecutionStore } from "@/lib/store/execution-store";
import { useIsMobile } from "@/hooks/use-is-mobile";

export function Workspace() {
  const initEngine = useExecutionStore((s) => s.initEngine);
  const setCode = useExecutionStore((s) => s.setCode);
  const setLanguage = useExecutionStore((s) => s.setLanguage);
  const setStdin = useExecutionStore((s) => s.setStdin);
  const language = useExecutionStore((s) => s.language);
  const isMobile = useIsMobile();

  // Spin up the current language's engine as soon as the workspace mounts.
  useEffect(() => {
    initEngine();
  }, [initEngine]);

  // Restore language + code + stdin from a shared link (#s=…), if present.
  // Language first — setLanguage swaps the code buffer, so it must run before
  // setCode writes the shared source into it.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash.startsWith("#s=")) return;
    const payload = decodeShare(hash.slice(3));
    if (!payload) return;
    if (payload.language) setLanguage(payload.language);
    if (payload.stdin) setStdin(payload.stdin);
    setCode(payload.code);
  }, [setCode, setLanguage, setStdin]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex items-center gap-3 border-b border-[rgba(186,215,247,0.08)] bg-[rgba(5,6,15,0.6)] px-4 py-3 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-3" title="Back to home">
          <span className="ak-glass ak-hairline flex size-8 shrink-0 items-center justify-center rounded-md text-frost">
            <ScanSearch className="size-5" />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="font-display font-medium tracking-tight text-frost">RunX</span>
            <span className="truncate text-xs text-fog">
              {language === "javascript"
                ? "Run JavaScript in a sandboxed worker and see its output."
                : "Run Python line by line and watch your variables change."}
            </span>
          </span>
        </Link>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            href="/app/interview"
            className="flex h-8 items-center gap-1.5 rounded-md border border-[rgba(186,215,247,0.14)] bg-[rgba(199,211,234,0.05)] px-3 text-xs font-medium text-mist transition-colors hover:border-[rgba(155,140,247,0.4)] hover:text-frost"
            title="Practice DSA problems against a target complexity"
          >
            <BriefcaseBusiness className="size-3.5" />
            Interview mode
          </Link>
          <ShareButton />
        </div>
      </header>

      <div className="border-b border-[rgba(186,215,247,0.08)] px-4 py-2.5">
        <ExecutionControls />
      </div>

      <div className="min-h-0 flex-1">
        {isMobile ? (
          <MobileLayout />
        ) : (
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={55} minSize={30}>
              <div className="flex h-full flex-col">
                <EditorPanelHeader />
                <div className="min-h-0 flex-1">
                  <CodeEditor />
                </div>
                <InputsPanel />
                <StdinPanel />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={45} minSize={25}>
              <ResultTabs />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
}

/** Below `md`: a Code/Result focus toggle instead of side-by-side resizable
 *  panels — the split layout has no room to breathe on a phone/small-tablet
 *  width, and a fixed 50/50 split left both halves cramped. */
function MobileLayout() {
  return (
    <MobileSplitView
      editor={
        <>
          <EditorPanelHeader />
          <div className="min-h-0 flex-1">
            <CodeEditor />
          </div>
          <InputsPanel />
          <StdinPanel />
        </>
      }
      result={<ResultTabs />}
    />
  );
}

function ResultTabs() {
  return (
    <Tabs defaultValue="explain" className="flex h-full flex-col gap-0">
      <div className="border-b px-3 py-1.5">
        <TabsList className="h-8 w-full justify-start">
          <TabsTrigger value="explain" className="text-xs">
            Explain
          </TabsTrigger>
          <TabsTrigger value="complexity" className="text-xs">
            Complexity
          </TabsTrigger>
          <TabsTrigger value="output" className="text-xs">
            Output
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="explain" className="min-h-0 flex-1 overflow-hidden">
        <ExplainPanel />
      </TabsContent>
      <TabsContent value="complexity" className="min-h-0 flex-1 overflow-hidden">
        <ComplexityPanel />
      </TabsContent>
      <TabsContent value="output" className="min-h-0 flex-1 overflow-hidden">
        <OutputPanel />
      </TabsContent>
    </Tabs>
  );
}

/** Editor panel header: language picker + language-appropriate filename/hint. */
function EditorPanelHeader() {
  const language = useExecutionStore((s) => s.language);
  const isJs = language === "javascript";
  return (
    <PanelHeader>
      <span className="flex items-center gap-2">
        <LanguageSelector />
        <span>{isJs ? "main.js" : "main.py"}</span>
      </span>
      <span className="font-normal text-muted-foreground/70">
        {isJs ? "paste any JavaScript code" : "paste any Python code"}
      </span>
    </PanelHeader>
  );
}

function PanelHeader({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-[rgba(186,215,247,0.08)] bg-[rgba(186,214,247,0.02)] px-3 py-1.5 text-xs font-medium text-muted-foreground">
      {children}
    </div>
  );
}

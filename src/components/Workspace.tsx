"use client";

import { useEffect, type ReactNode } from "react";
import { ScanSearch } from "lucide-react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { ExecutionControls } from "@/components/execution/ExecutionControls";
import { OutputPanel } from "@/components/execution/OutputPanel";
import { InputsPanel } from "@/components/execution/InputsPanel";
import { ExplainPanel } from "@/components/explain/ExplainPanel";
import { ComplexityPanel } from "@/components/explain/ComplexityPanel";
import { useExecutionStore } from "@/lib/store/execution-store";
import { useIsMobile } from "@/hooks/use-is-mobile";

export function Workspace() {
  const initEngine = useExecutionStore((s) => s.initEngine);
  const isMobile = useIsMobile();

  // Spin up the Pyodide worker as soon as the workspace mounts.
  useEffect(() => {
    initEngine();
  }, [initEngine]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <ScanSearch className="size-5" />
        </div>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="font-semibold tracking-tight">RunX</span>
          <span className="truncate text-xs text-muted-foreground">
            Run Python step-by-step and watch your variables change.
          </span>
        </div>
      </header>

      <div className="border-b px-4 py-2.5">
        <ExecutionControls />
      </div>

      <div className="min-h-0 flex-1">
        {isMobile ? (
          <MobileLayout />
        ) : (
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={55} minSize={30}>
              <div className="flex h-full flex-col">
                <PanelHeader>
                  <span>main.py</span>
                  <span className="font-normal text-muted-foreground/70">paste any Python code</span>
                </PanelHeader>
                <div className="min-h-0 flex-1">
                  <CodeEditor />
                </div>
                <InputsPanel />
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

/** Below `md`: a single scrollable column instead of side-by-side resizable panels — the
 *  split layout has no room to breathe on a phone/small-tablet width and just clips. */
function MobileLayout() {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex h-[50vh] shrink-0 flex-col border-b">
        <PanelHeader>
          <span>main.py</span>
          <span className="font-normal text-muted-foreground/70">paste any Python code</span>
        </PanelHeader>
        <div className="min-h-0 flex-1">
          <CodeEditor />
        </div>
        <InputsPanel />
      </div>

      <div className="h-[50vh] shrink-0">
        <ResultTabs />
      </div>
    </div>
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

function PanelHeader({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground">
      {children}
    </div>
  );
}

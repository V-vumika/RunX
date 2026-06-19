"use client";

import { useEffect, type ReactNode } from "react";
import { ScanSearch } from "lucide-react";
import { ExamplePicker } from "@/components/editor/ExamplePicker";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { ExecutionControls } from "@/components/execution/ExecutionControls";
import { OutputPanel } from "@/components/execution/OutputPanel";
import { CallStackPanel } from "@/components/execution/CallStackPanel";
import { VariableInspector } from "@/components/inspector/VariableInspector";
import { MemoryView } from "@/components/visualizers/MemoryView";
import { DsaPanel } from "@/components/visualizers/DsaPanel";
import { AlgorithmPanel } from "@/components/visualizers/AlgorithmPanel";
import { useExecutionStore } from "@/lib/store/execution-store";

export function Workspace() {
  const initEngine = useExecutionStore((s) => s.initEngine);

  // Spin up the Pyodide worker as soon as the workspace mounts.
  useEffect(() => {
    initEngine();
  }, [initEngine]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <ScanSearch className="size-5" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="flex items-center gap-2 font-semibold tracking-tight">
            RunX
            <Badge variant="secondary" className="text-[10px]">
              Phase 1
            </Badge>
          </span>
          <span className="text-xs text-muted-foreground">
            Run Python step-by-step and watch your variables change.
          </span>
        </div>
      </header>

      <div className="border-b px-4 py-2.5">
        <ExecutionControls />
      </div>

      <div className="min-h-0 flex-1">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={55} minSize={30}>
            <div className="flex h-full flex-col">
              <PanelHeader>
                  <span>main.py</span>
                  <ExamplePicker />
              </PanelHeader>
              <div className="min-h-0 flex-1">
                <CodeEditor />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={45} minSize={25}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={55} minSize={20}>
                <div className="flex h-full flex-col">
                  <PanelHeader>Variables</PanelHeader>
                  <div className="min-h-0 flex-1">
                    <VariableInspector />
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize={45} minSize={20}>
                <Tabs
                  defaultValue="output"
                  className="flex h-full flex-col gap-0"
                >
                  <div className="border-b px-3 py-1.5">
                    <TabsList className="h-8">
                      <TabsTrigger value="output" className="text-xs">
                        Output
                      </TabsTrigger>
                      <TabsTrigger value="dsa" className="text-xs">
                        DSA
                      </TabsTrigger>
                      <TabsTrigger value="algorithms" className="text-xs">
                        Algorithms
                      </TabsTrigger>
                      <TabsTrigger value="memory" className="text-xs">
                        Memory
                      </TabsTrigger>
                      <TabsTrigger value="stack" className="text-xs">
                        Call Stack
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value="output" className="min-h-0">
                    <OutputPanel />
                  </TabsContent>
                  <TabsContent value="dsa" className="min-h-0">
                    <DsaPanel />
                  </TabsContent>
                  <TabsContent value="algorithms" className="min-h-0">
                    <AlgorithmPanel />
                  </TabsContent>
                  <TabsContent value="memory" className="min-h-0">
                    <MemoryView />
                  </TabsContent>
                  <TabsContent value="stack" className="min-h-0">
                    <CallStackPanel />
                  </TabsContent>
                </Tabs>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

function PanelHeader({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground">
      {children}
    </div>
  );
}

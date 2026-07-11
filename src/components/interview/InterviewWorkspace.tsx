"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { LanguageSelector } from "@/components/editor/LanguageSelector";
import { ExecutionControls } from "@/components/execution/ExecutionControls";
import { OutputPanel } from "@/components/execution/OutputPanel";
import { InputsPanel } from "@/components/execution/InputsPanel";
import { StdinPanel } from "@/components/execution/StdinPanel";
import { ExplainPanel } from "@/components/explain/ExplainPanel";
import { ComplexityPanel } from "@/components/explain/ComplexityPanel";
import { ProblemPanel } from "@/components/interview/ProblemPanel";
import { ProblemPicker } from "@/components/interview/ProblemPicker";
import { Timer } from "@/components/interview/Timer";
import { useExecutionStore } from "@/lib/store/execution-store";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { INTERVIEW_PROBLEMS, getInterviewProblem } from "@/lib/interview/problems";

/**
 * Interview practice mode: the same execution engine and panels as the main
 * workspace (Explain, Complexity, Output — all reused as-is), plus a Problem
 * tab that swaps in a curated DSA prompt, examples you can run, progressive
 * hints, and a rules-based grade of the measured complexity against the
 * problem's target. Nothing in the execution path changes — a problem's
 * starter is just a driverless function, so the existing entry-synthesis +
 * InputsPanel + run pipeline does the rest.
 */
export function InterviewWorkspace() {
  const [problemId, setProblemId] = useState(INTERVIEW_PROBLEMS[0].id);
  const problem = getInterviewProblem(problemId) ?? INTERVIEW_PROBLEMS[0];

  const initEngine = useExecutionStore((s) => s.initEngine);
  const setCode = useExecutionStore((s) => s.setCode);
  const language = useExecutionStore((s) => s.language);
  const isMobile = useIsMobile();

  useEffect(() => {
    initEngine();
  }, [initEngine]);

  // Load the current problem's starter whenever the problem or the language
  // changes (switching languages mid-problem re-loads that language's starter,
  // same as picking a new problem — an in-progress solution isn't preserved
  // across a language switch, which matches the main workspace's behavior).
  useEffect(() => {
    const starter = language === "javascript" ? problem.starter.javascript : problem.starter.python;
    setCode(starter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemId, language]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex flex-wrap items-center gap-3 border-b border-[rgba(186,215,247,0.08)] bg-[rgba(5,6,15,0.6)] px-4 py-3 backdrop-blur-xl">
        <Link href="/app" className="flex shrink-0 items-center gap-3" title="Exit interview mode">
          <span className="ak-glass ak-hairline flex size-8 shrink-0 items-center justify-center rounded-md text-frost">
            <BriefcaseBusiness className="size-5" />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="font-display font-medium tracking-tight text-frost">Interview mode</span>
            <span className="truncate text-xs text-fog">Exit to workspace</span>
          </span>
        </Link>

        <ProblemPicker activeId={problemId} onSelect={setProblemId} />

        <div className="ml-auto shrink-0">
          <Timer key={problemId} />
        </div>
      </header>

      <div className="border-b border-[rgba(186,215,247,0.08)] px-4 py-2.5">
        <ExecutionControls />
      </div>

      <div className="min-h-0 flex-1">
        {isMobile ? (
          <MobileLayout problem={problem} />
        ) : (
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={50} minSize={28}>
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

            <ResizablePanel defaultSize={50} minSize={28}>
              <ResultTabs problem={problem} />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
}

function MobileLayout({ problem }: { problem: (typeof INTERVIEW_PROBLEMS)[number] }) {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex h-[50vh] shrink-0 flex-col border-b">
        <EditorPanelHeader />
        <div className="min-h-0 flex-1">
          <CodeEditor />
        </div>
        <InputsPanel />
        <StdinPanel />
      </div>

      <div className="h-[50vh] shrink-0">
        <ResultTabs problem={problem} />
      </div>
    </div>
  );
}

function ResultTabs({ problem }: { problem: (typeof INTERVIEW_PROBLEMS)[number] }) {
  return (
    <Tabs defaultValue="problem" className="flex h-full flex-col gap-0">
      <div className="border-b px-3 py-1.5">
        <TabsList className="h-8 w-full justify-start">
          <TabsTrigger value="problem" className="text-xs">
            Problem
          </TabsTrigger>
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
      <TabsContent value="problem" className="min-h-0 flex-1 overflow-hidden">
        <ProblemPanel problem={problem} />
      </TabsContent>
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

/** Editor panel header: language picker + language-appropriate filename hint. */
function EditorPanelHeader() {
  const language = useExecutionStore((s) => s.language);
  const isJs = language === "javascript";
  return (
    <PanelHeader>
      <span className="flex items-center gap-2">
        <LanguageSelector />
        <span>{isJs ? "solution.js" : "solution.py"}</span>
      </span>
      <span className="font-normal text-muted-foreground/70">write your solution, then Run</span>
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

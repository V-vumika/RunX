import type { Metadata } from "next";
import { InterviewWorkspace } from "@/components/interview/InterviewWorkspace";

export const metadata: Metadata = {
  title: "RunX — Interview mode",
};

export default function InterviewPage() {
  return <InterviewWorkspace />;
}

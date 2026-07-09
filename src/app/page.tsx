import type { Metadata } from "next";

import { LaunchButton } from "@/components/landing/LaunchButton";

export const metadata: Metadata = {
  title: "RunX — See how your code actually runs",
  description:
    "A visual Python playground for students: step through every line, watch variables and data structures change, see the algorithm animate, and get the complexity — not just the output.",
};

// Landing lives at "/"; the interactive workspace moved to "/app". The rich
// landing sections are composed in src/components/landing (built out separately);
// this is the minimal, working front door.
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">RunX</h1>
      <p className="max-w-md text-muted-foreground">
        Run Python step-by-step and watch your variables, data structures, and complexity come to life.
      </p>
      <LaunchButton />
    </main>
  );
}

import type { Metadata } from "next";

import { Landing } from "@/components/landing/Landing";

export const metadata: Metadata = {
  title: "RunX — See how your code actually runs",
  description:
    "A visual Python playground for students: step through every line, watch variables and data structures change, see the algorithm animate, and get the complexity — not just the output.",
};

// Landing lives at "/"; the interactive workspace lives at "/app".
export default function Home() {
  return <Landing />;
}

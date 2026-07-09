import Link from "next/link";
import { Button } from "@/components/ui/button";

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
      <Button asChild size="lg">
        <Link href="/app">Launch RunX</Link>
      </Button>
    </main>
  );
}

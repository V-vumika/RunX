import { Hero } from "./Hero";

/**
 * The marketing landing page shown at "/". Composed of independent sections so
 * each can evolve on its own; the workspace itself lives at "/app".
 */
export function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Hero />
    </div>
  );
}

import { SiteHeader } from "./SiteHeader";
import { Hero } from "./Hero";
import { Features } from "./Features";
import { Showcase } from "./Showcase";
import { CtaFooter } from "./CtaFooter";

/**
 * The marketing landing page shown at "/". Composed of independent sections so
 * each can evolve on its own; the workspace itself lives at "/app".
 */
export function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <Hero />
      <Features />
      <Showcase />
      <CtaFooter />
    </div>
  );
}

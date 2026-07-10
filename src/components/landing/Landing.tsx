import { SiteHeader } from "./SiteHeader";
import { Hero } from "./Hero";
import { Features } from "./Features";
import { Showcase } from "./Showcase";
import { CtaFooter } from "./CtaFooter";

/**
 * The marketing landing page shown at "/". The starfield lives inside the hero
 * (like the reference), so the sections below sit on the plain midnight canvas.
 * Composed of independent sections; the workspace lives at "/app".
 */
export function Landing() {
  return (
    <div className="relative min-h-screen text-foreground">
      <SiteHeader />
      <Hero />
      <Features />
      <Showcase />
      <CtaFooter />
    </div>
  );
}

import { ParticleField } from "./authkit/ParticleField";
import { SiteHeader } from "./SiteHeader";
import { Hero } from "./Hero";
import { Features } from "./Features";
import { Showcase } from "./Showcase";
import { CtaFooter } from "./CtaFooter";

/**
 * The marketing landing page shown at "/". The starfield sits behind everything
 * (over the midnight body background, under the content), so the container stays
 * transparent. Composed of independent sections; the workspace lives at "/app".
 */
export function Landing() {
  return (
    <div className="relative min-h-screen text-foreground">
      <ParticleField />
      <SiteHeader />
      <Hero />
      <Features />
      <Showcase />
      <CtaFooter />
    </div>
  );
}

import RunXHero from "@/components/ui/hero";
import { SiteNav } from "./SiteNav";
import { HowItWorks } from "./HowItWorks";
import { Features } from "./Features";
import { VisualizerShowcase } from "./VisualizerShowcase";
import { Languages } from "./Languages";
import { Faq } from "./Faq";
import { CtaFooter } from "./CtaFooter";

/**
 * The marketing landing page shown at "/". A persistent nav overlays a
 * full-viewport shader hero (with a self-playing product demo); the product
 * story then unfolds section by section on one black canvas, every block
 * animating in on scroll. The workspace lives at "/app".
 */
export function Landing() {
  return (
    <div className="relative min-h-screen bg-black text-white">
      <SiteNav />
      <RunXHero />
      <HowItWorks />
      <Features />
      <VisualizerShowcase />
      <Languages />
      <Faq />
      <CtaFooter />
    </div>
  );
}

import { LaunchButton } from "./LaunchButton";

/** Closing call-to-action band + a quiet footer. */
export function CtaFooter() {
  return (
    <>
      <section className="relative overflow-hidden border-t border-border/60">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_120%,rgba(139,124,246,0.18),transparent_70%)]"
        />
        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to watch your code run?
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Paste any Python, press Run, and step through it line by line. Free, and it all
            runs in your browser.
          </p>
          <div className="mt-8 flex justify-center">
            <LaunchButton />
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <span className="font-medium text-foreground">RunX</span>
          <span className="text-center">
            Built for students · runs Python in your browser with Pyodide
          </span>
        </div>
      </footer>
    </>
  );
}

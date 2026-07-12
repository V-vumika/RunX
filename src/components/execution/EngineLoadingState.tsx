/**
 * Shown in a result panel (Explain, Complexity) while the language engine is
 * still downloading — Pyodide's first load is a real multi-second CDN fetch,
 * and a bare "Press Run" message during that window reads as broken rather
 * than loading. A pulsing brand dot instead of a spinner keeps it calm.
 */
export function EngineLoadingState() {
  return (
    <div className="flex h-full items-center justify-center p-6 text-center">
      <div className="max-w-xs">
        <span className="relative mx-auto mb-3 flex size-8 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-void-violet/30" />
          <span className="relative size-2.5 rounded-full bg-void-violet" />
        </span>
        <p className="text-sm font-medium text-foreground">Setting up the Python runtime</p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          A one-time download, about 10 seconds on a typical connection — every run after this is
          instant.
        </p>
      </div>
    </div>
  );
}

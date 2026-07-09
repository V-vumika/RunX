import { cn } from "@/lib/utils";

/**
 * A quiet section marker: dot-tracked all-caps mono, flanked by hairlines that
 * fade in from transparent. Opens every section in the AuthKit system.
 */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      <span className="h-px w-12 bg-gradient-to-r from-transparent to-[rgba(186,215,247,0.2)]" />
      <span className="font-mono text-[13px] uppercase tracking-[0.2em] text-mist">{children}</span>
      <span className="h-px w-12 bg-gradient-to-l from-transparent to-[rgba(186,215,247,0.2)]" />
    </div>
  );
}

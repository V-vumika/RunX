import { cn } from "@/lib/utils";

/**
 * A glass plate: a barely-there frost tint with elevation built from an inset
 * highlight and a soft dark halo rather than a hard border. `deep` gives the
 * heavier, nearly-opaque midnight surface used for the floating hero plates.
 */
export function GlassCard({
  children,
  className,
  deep = false,
}: {
  children: React.ReactNode;
  className?: string;
  deep?: boolean;
}) {
  return (
    <div className={cn("rounded-2xl", deep ? "ak-glass-deep" : "ak-glass", className)}>
      {children}
    </div>
  );
}

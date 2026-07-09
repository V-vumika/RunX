import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The single call-to-action that routes into the workspace (/app). Shared by the
 * landing sections and the app header so the entry point looks and reads the same
 * everywhere.
 */
export function LaunchButton({
  label = "Launch RunX",
  size = "lg",
  variant = "default",
  className,
}: {
  label?: string;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline" | "secondary";
  className?: string;
}) {
  return (
    <Button asChild size={size} variant={variant} className={cn("group gap-2", className)}>
      <Link href="/app">
        {label}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </Button>
  );
}

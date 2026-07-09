import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The way into the workspace (/app). Two treatments in the AuthKit language:
 * `primary` is the single violet action, `ghost` is a frosted pill for
 * secondary and nav placements. Both are full pills.
 */
export function LaunchButton({
  label = "Launch RunX",
  href = "/app",
  variant = "primary",
  size = "lg",
  withArrow = true,
  className,
}: {
  label?: string;
  href?: string;
  variant?: "primary" | "ghost";
  size?: "sm" | "lg";
  withArrow?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors",
        size === "sm" ? "px-4 py-2 text-sm" : "px-6 py-3 text-[15px]",
        variant === "primary"
          ? "bg-void-violet text-white shadow-[0_0_24px_rgba(102,58,243,0.4)] hover:bg-[#7248f5]"
          : "ak-hairline bg-[rgba(186,214,247,0.06)] text-frost hover:bg-[rgba(186,214,247,0.12)]",
        className
      )}
    >
      {label}
      {withArrow && <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />}
    </Link>
  );
}

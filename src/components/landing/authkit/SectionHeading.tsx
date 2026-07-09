import { cn } from "@/lib/utils";

import { Eyebrow } from "./Eyebrow";

/**
 * The standard section opener: eyebrow, a large Space Grotesk heading filled
 * with the skywash gradient, and a single line of muted body copy.
 */
export function SectionHeading({
  eyebrow,
  title,
  body,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  body?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div className={cn(centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl", className)}>
      {eyebrow && <Eyebrow className={cn("mb-6", !centered && "justify-start")}>{eyebrow}</Eyebrow>}
      <h2 className="ak-skywash text-balance font-display text-[2rem] font-medium leading-[1.1] tracking-tight sm:text-[2.75rem]">
        {title}
      </h2>
      {body && (
        <p className="mt-5 text-pretty text-base leading-relaxed text-mist sm:text-[17px]">{body}</p>
      )}
    </div>
  );
}

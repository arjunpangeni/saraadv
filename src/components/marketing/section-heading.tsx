import { BlurFade } from "@/components/ui/blur-fade";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  size?: "default" | "compact";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  size = "default",
  className,
}: SectionHeadingProps) {
  const compact = size === "compact";
  return (
    <BlurFade inView offset={8} className={cn(align === "center" && "text-center mx-auto max-w-2xl", className)}>
      {eyebrow && (
        <p className={cn("text-xs font-semibold tracking-[0.2em] text-tz-blue-deep uppercase", compact ? "mb-1.5" : "mb-3")}>
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "heading-soft text-pretty font-heading font-semibold tracking-[-0.015em] text-foreground",
          compact ? "text-xl sm:text-2xl" : "text-[1.7rem] sm:text-[2rem] md:text-[2.35rem]"
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "text-pretty leading-[1.75] text-muted-foreground",
            compact ? "mt-1.5 max-w-2xl text-[1.05rem]" : "mt-5 max-w-xl text-[1.05rem]",
            align === "center" && "mx-auto"
          )}
        >
          {description}
        </p>
      )}
    </BlurFade>
  );
}

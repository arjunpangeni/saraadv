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
        <p className={cn("text-sm font-medium tracking-tight text-brand-sky", compact ? "mb-1.5" : "mb-3")}>
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "text-pretty font-display font-extrabold tracking-tight text-foreground",
          compact ? "text-xl sm:text-2xl" : "text-3xl md:text-4xl"
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "text-pretty leading-relaxed text-foreground/70",
            compact ? "mt-1.5 max-w-2xl text-base" : "mt-4 max-w-xl text-lg lg:text-xl",
            align === "center" && "mx-auto"
          )}
        >
          {description}
        </p>
      )}
    </BlurFade>
  );
}

import { cn } from "@/lib/utils";

interface PageIntroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  children?: React.ReactNode;
}

export function PageIntro({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  children,
}: PageIntroProps) {
  return (
    <div className={cn(align === "center" && "mx-auto max-w-2xl text-center", className)}>
      {eyebrow ? (
        <p className="text-xs font-semibold tracking-[0.2em] text-tz-blue-deep uppercase">{eyebrow}</p>
      ) : null}
      <h1
        className={cn(
          "heading-soft text-pretty font-heading text-[1.7rem] leading-[1.28] font-semibold tracking-[-0.015em] text-foreground sm:text-[2rem] md:text-[2.6rem]",
          eyebrow && "mt-3"
        )}
      >
        {title}
      </h1>
      {description ? (
        <p
          className={cn(
            "mt-5 max-w-xl text-pretty text-[1.05rem] leading-[1.75] text-muted-foreground",
            align === "center" && "mx-auto"
          )}
        >
          {description}
        </p>
      ) : null}
      {children}
    </div>
  );
}

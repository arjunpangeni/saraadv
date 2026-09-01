import { cn } from "@/lib/utils";

export function ScrollBlur({
  side,
  blur = "4px",
  height = "120px",
  stop = "50%",
  className,
}: {
  side: "top" | "bottom";
  blur?: string;
  height?: string;
  stop?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      data-side={side}
      className={cn("scroll-edge-blur", className)}
      style={
        {
          "--scroll-blur": blur,
          "--scroll-blur-height": height,
          "--scroll-blur-stop": stop,
        } as React.CSSProperties
      }
    />
  );
}

export function MarketingScrollBlur() {
  return (
    <>
      <ScrollBlur side="top" blur="4px" height="120px" stop="50%" />
      <ScrollBlur side="top" blur="1px" height="150px" stop="25%" />
    </>
  );
}

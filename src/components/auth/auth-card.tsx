import { cn } from "@/lib/utils";

export function AuthCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-3.5 shadow-[var(--shadow-card)]",
        className
      )}
    >
      {children}
    </div>
  );
}

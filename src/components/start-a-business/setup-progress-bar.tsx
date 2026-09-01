import { cn } from "@/lib/utils";

export function SetupProgressBar({
  percent,
  completed,
  total,
  className,
  showLabel = true,
}: {
  percent: number;
  completed: number;
  total: number;
  className?: string;
  showLabel?: boolean;
}) {
  const safePercent = Math.min(100, Math.max(0, percent));

  return (
    <div className={cn("space-y-1.5", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Checklist progress</span>
          <span>
            {total > 0 ? `${completed}/${total} steps · ${safePercent}%` : "No required steps"}
          </span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-brand-sky transition-all duration-300"
          style={{ width: `${safePercent}%` }}
        />
      </div>
    </div>
  );
}

import Link from "next/link";
import { cn } from "@/lib/utils";

export type DashboardStat = {
  value: string;
  label: string;
  description?: string;
  href?: string;
};

export function DashboardStats({
  stats,
  className,
}: {
  stats: DashboardStat[];
  className?: string;
}) {
  if (stats.length === 0) return null;

  const cols =
    stats.length === 1
      ? "grid-cols-1"
      : stats.length === 2
        ? "grid-cols-2"
        : stats.length === 3
          ? "grid-cols-1 sm:grid-cols-3"
          : stats.length === 6
            ? "grid-cols-2 sm:grid-cols-3"
            : "grid-cols-2 sm:grid-cols-4";

  return (
    <ul
      className={cn(
        "grid overflow-hidden rounded-xl border border-border bg-border",
        cols,
        className
      )}
    >
      {stats.map((stat) => {
        const inner = (
          <>
            <p className="text-xs font-medium text-foreground/55">{stat.label}</p>
            <p className="mt-1 font-display text-xl font-extrabold tabular-nums tracking-tight text-foreground">
              {stat.value}
            </p>
            {stat.description ? (
              <p className="mt-1 text-xs leading-snug text-foreground/45">{stat.description}</p>
            ) : null}
          </>
        );
        return (
          <li key={stat.label} className="bg-card px-4 py-3">
            {stat.href ? (
              <Link href={stat.href} className="block hover:text-brand-sky">
                {inner}
              </Link>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ul>
  );
}

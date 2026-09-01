import Link from "next/link";
import { cn } from "@/lib/utils";

export function DashboardPanel({
  id,
  title,
  description,
  action,
  children,
  className,
}: {
  id?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card scroll-mt-24",
        className
      )}
    >
      <header className="flex items-start justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <div className="min-w-0">
          <h2 className="font-display text-base font-extrabold tracking-tight text-foreground">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm leading-snug text-foreground/60">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

export function DashboardRow({
  href,
  title,
  meta,
  badge,
  onClick,
}: {
  href?: string;
  title: string;
  meta?: string;
  badge?: React.ReactNode;
  onClick?: () => void;
}) {
  const className =
    "flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50";
  const body = (
    <>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        {meta ? <p className="truncate text-xs text-foreground/55">{meta}</p> : null}
      </div>
      {badge ? <div className="shrink-0">{badge}</div> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}

export function DashboardEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 py-5 text-sm leading-relaxed text-foreground/60">{children}</p>
  );
}

import { forwardRef } from "react";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import SmoothButton from "@/components/smoothui/smooth-button";
import { cn } from "@/lib/utils";

type WorkspaceCardProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconWrap?: string;
  badge?: React.ReactNode;
  meta?: string;
  cta?: { href: string; label: string; onClick?: () => void };
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export const WorkspaceCard = forwardRef<HTMLElement, WorkspaceCardProps>(
  function WorkspaceCard(
    { eyebrow, title, description, icon: Icon, iconWrap, badge, meta, cta, children, className, style },
    ref
  ) {
    return (
      <article
        ref={ref}
        style={style}
        className={cn(
          "group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5",
          className
        )}
      >
        {(Icon || badge) && (
          <div className="mb-4 flex items-start justify-between gap-3">
            {Icon ? (
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  iconWrap ?? "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300"
                )}
              >
                <Icon className="size-5" aria-hidden />
              </div>
            ) : (
              <span />
            )}
            {badge}
          </div>
        )}
        {eyebrow ? (
          <p className="text-sm font-medium tracking-tight text-brand-sky">{eyebrow}</p>
        ) : null}
        <h3 className="mt-1 text-pretty font-display text-xl font-extrabold tracking-tight text-foreground">
          {title}
        </h3>
        {description ? (
          <p className="mt-2 flex-1 text-pretty text-base leading-relaxed text-foreground/70">{description}</p>
        ) : (
          <div className="flex-1" />
        )}
        {meta ? <p className="mt-2 text-sm font-medium tracking-tight text-foreground/50">{meta}</p> : null}
        {children}
        {cta ? (
          <SmoothButton asChild variant="candy" size="sm" className="mt-4 w-fit">
            <Link href={cta.href} onClick={cta.onClick}>
              {cta.label}
              <ArrowRight className="size-4" />
            </Link>
          </SmoothButton>
        ) : null}
      </article>
    );
  }
);

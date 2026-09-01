import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  warning: {
    wrap: "border-border bg-warning-bg text-warning-fg",
    Icon: AlertCircle,
  },
  danger: {
    wrap: "border-destructive/30 bg-destructive/10 text-destructive",
    Icon: AlertCircle,
  },
  success: {
    wrap: "border-border bg-success-bg text-success-fg",
    Icon: CheckCircle2,
  },
  info: {
    wrap: "border-border bg-brand-sky-muted text-foreground",
    Icon: Info,
  },
} as const;

export function StatusBanner({
  variant,
  title,
  children,
  className,
}: {
  variant: keyof typeof VARIANTS;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { wrap, Icon } = VARIANTS[variant];

  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-xl border px-4 py-3 text-sm", wrap, className)}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5 opacity-90")}>{children}</div>}
      </div>
    </div>
  );
}

export function FormError({ children, className }: { children?: React.ReactNode; className?: string }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className={cn(
        "rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive",
        className
      )}
    >
      {children}
    </p>
  );
}

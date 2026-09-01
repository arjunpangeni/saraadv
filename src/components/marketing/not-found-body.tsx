import Link from "next/link";
import { SearchX } from "lucide-react";
import { MARKETING_SERVICES } from "@/lib/marketing-nav";
import SmoothButton from "@/components/smoothui/smooth-button";

const RECOVERY = [
  { href: "/", label: "Home" },
  ...MARKETING_SERVICES,
  { href: "/marketplace", label: "Marketplace" },
  { href: "/contact", label: "Contact" },
];

export function NotFoundBody() {
  return (
    <div className="container-page py-20 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-brand-sky-muted text-brand-sky">
          <SearchX className="size-7" aria-hidden />
        </div>
        <h1 className="text-pretty font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-4 text-pretty text-lg leading-relaxed text-foreground/70">
          This address is missing or the listing is no longer public. Try one of the pages below, or go home.
        </p>
        <div className="mt-8">
          <SmoothButton asChild variant="candy" size="lg">
            <Link href="/">Back to home</Link>
          </SmoothButton>
        </div>
      </div>

      <nav aria-label="Popular pages" className="mx-auto mt-14 max-w-3xl">
        <p className="mb-4 text-center text-sm font-medium tracking-tight text-foreground/50">Popular pages</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {RECOVERY.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-[var(--shadow-card)] transition-colors hover:border-brand hover:text-brand-sky"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

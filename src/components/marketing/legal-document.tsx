import Link from "next/link";
import { SITE_OFFICE } from "@/lib/seo";
import { cn } from "@/lib/utils";

const DOCS = [
  { href: "/privacy", label: "Privacy Policy", key: "privacy" },
  { href: "/terms", label: "Terms of Use", key: "terms" },
] as const;

export function LegalDocument({
  title,
  description,
  updated,
  current,
  children,
}: {
  title: string;
  description: string;
  updated: string;
  current: "privacy" | "terms";
  children: React.ReactNode;
}) {
  const other = DOCS.find((doc) => doc.key !== current);

  return (
    <main className="flex-1">
      <article className="container-page max-w-2xl py-20 sm:py-28">
        <p className="text-xs font-semibold tracking-[0.2em] text-tz-blue-deep uppercase">Last updated {updated}</p>
        <h1 className="heading-soft mt-3 text-pretty font-heading text-[1.7rem] leading-[1.28] font-semibold tracking-[-0.015em] text-foreground sm:text-[2rem] md:text-[2.6rem]">
          {title}
        </h1>
        <p className="mt-5 text-pretty text-[1.05rem] leading-[1.75] text-muted-foreground">{description}</p>

        <nav aria-label="Legal documents" className="mt-6 flex gap-5 text-sm font-medium">
          {DOCS.map((doc) => (
            <Link
              key={doc.href}
              href={doc.href}
              aria-current={doc.key === current ? "page" : undefined}
              className={cn(
                doc.key === current
                  ? "text-foreground"
                  : "text-foreground/50 transition-colors hover:text-foreground"
              )}
            >
              {doc.label}
            </Link>
          ))}
        </nav>

        <div className="mt-12 divide-y divide-border/80">{children}</div>

        <p className="mt-12 text-sm leading-relaxed text-foreground/55">
          Questions:{" "}
          <a href={`mailto:${SITE_OFFICE.email}`} className="text-foreground hover:underline">
            {SITE_OFFICE.email}
          </a>
          {" · "}
          <Link href="/contact" className="text-foreground hover:underline">
            Contact
          </Link>
          {other ? (
            <>
              {" · "}
              <Link href={other.href} className="text-foreground hover:underline">
                {other.label}
              </Link>
            </>
          ) : null}
        </p>
      </article>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-8 first:pt-0">
      <h2 className="heading-soft text-pretty font-heading text-xl font-semibold tracking-[-0.015em] text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-pretty text-[1.05rem] leading-[1.75] text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

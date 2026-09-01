import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

export type BreadcrumbItem = {
  name: string;
  href?: string;
};

export function PageBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const crumbs: BreadcrumbItem[] = [{ name: "Home", href: "/" }, ...items];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-foreground/60">
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1;
            return (
              <li key={`${crumb.name}-${index}`} className="flex items-center gap-1">
                {index > 0 ? <ChevronRight className="size-3.5 shrink-0" aria-hidden /> : null}
                {crumb.href && !last ? (
                  <Link href={crumb.href} className="hover:text-brand-sky hover:underline">
                    {crumb.name}
                  </Link>
                ) : (
                  <span className="font-medium text-foreground" aria-current="page">
                    {crumb.name}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

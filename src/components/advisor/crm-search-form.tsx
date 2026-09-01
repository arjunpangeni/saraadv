"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { crmHref, type CrmTab, type CrmView } from "@/components/advisor/crm-desk";

export function CrmSearchForm({
  tab,
  view,
  q,
}: {
  tab: CrmTab;
  view: CrmView;
  q: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(q);

  useEffect(() => {
    setValue(q);
  }, [q]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push(crmHref({ tab, view, q: value }), { scroll: false });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
      <Input
        name="q"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search name, email, or firm"
        className="h-10 max-w-sm"
        aria-label="Search leads"
      />
      <Button type="submit" variant="outline" size="sm">
        Search
      </Button>
      {q ? (
        <Button asChild variant="ghost" size="sm">
          <Link href={crmHref({ tab, view })} scroll={false}>
            Clear
          </Link>
        </Button>
      ) : null}
    </form>
  );
}

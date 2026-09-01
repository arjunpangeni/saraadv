"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setupDeskHref, type SetupDeskView } from "@/components/advisor/business-setup-desk";

export function BusinessSetupSearchForm({
  view,
  q,
  fdi,
}: {
  view: SetupDeskView;
  q: string;
  fdi: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(q);

  useEffect(() => {
    setValue(q);
  }, [q]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push(setupDeskHref({ view, q: value, fdi }), { scroll: false });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
      <Input
        name="q"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search company, contact, or email"
        className="h-10 max-w-sm"
        aria-label="Search setup requests"
      />
      <Button type="submit" variant="outline" size="sm">
        Search
      </Button>
      <Button asChild variant={fdi ? "sky" : "outline"} size="sm">
        <Link href={setupDeskHref({ view, q: value, fdi: !fdi })} scroll={false}>
          FDI only
        </Link>
      </Button>
      {q ? (
        <Button asChild variant="ghost" size="sm">
          <Link href={setupDeskHref({ view, fdi })} scroll={false}>
            Clear
          </Link>
        </Button>
      ) : null}
    </form>
  );
}

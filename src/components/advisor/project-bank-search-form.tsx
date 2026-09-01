"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  projectBankHref,
  type ProjectBankFilter,
} from "@/components/advisor/project-bank-desk";

export function ProjectBankSearchForm({
  status,
  q,
}: {
  status: ProjectBankFilter;
  q: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(q);

  useEffect(() => {
    setValue(q);
  }, [q]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push(projectBankHref({ status, q: value }), { scroll: false });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
      <Input
        name="q"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search title, founder, or email"
        className="h-10 max-w-sm"
        aria-label="Search project ideas"
      />
      <Button type="submit" variant="outline" size="sm">
        Search
      </Button>
      {q ? (
        <Button asChild variant="ghost" size="sm">
          <Link href={projectBankHref({ status })} scroll={false}>
            Clear
          </Link>
        </Button>
      ) : null}
    </form>
  );
}

"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  inquiriesHref,
  type InquiryStatusFilter,
} from "@/components/advisor/inquiries-desk";
import type { ServiceInquiryTopic } from "@/lib/service-inquiries";

export function InquiriesSearchForm({
  type,
  status,
  q,
}: {
  type?: ServiceInquiryTopic;
  status?: InquiryStatusFilter;
  q: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(q);

  useEffect(() => {
    setValue(q);
  }, [q]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push(inquiriesHref({ type, status, q: value }), { scroll: false });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
      <Input
        name="q"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search name, email, or message"
        className="h-10 max-w-sm"
        aria-label="Search inquiries"
      />
      <Button type="submit" variant="outline" size="sm">
        Search
      </Button>
      {q ? (
        <Button asChild variant="ghost" size="sm">
          <Link href={inquiriesHref({ type, status })} scroll={false}>
            Clear
          </Link>
        </Button>
      ) : null}
    </form>
  );
}

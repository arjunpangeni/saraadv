"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Pagination from "@/components/smoothui/pagination";

export function PagePagination({
  page,
  totalPages,
  param = "page",
}: {
  page: number;
  totalPages: number;
  param?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function onPageChange(next: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (next <= 1) params.delete(param);
    else params.set(param, String(next));
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="pt-2">
      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}

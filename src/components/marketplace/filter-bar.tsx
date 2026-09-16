"use client";

import { useCallback, useEffect, useId, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SelectField } from "@/components/ui/select-field";
import { INDUSTRY_OPTIONS, INDUSTRY_LABELS } from "@/types/listing";
import { DEAL_VALUE_BAND_LABELS } from "@/lib/calc";
import { NEPAL_PROVINCES } from "@/lib/nepal-locations";
import {
  CollapsibleDiscoverFilters,
  FilterChips,
  FilterField,
  SearchField,
} from "@/components/marketing/discover-search";

const DROPPED_KEYS = ["positiveEbitdaOnly", "minRevenueNpr", "district"];

export function MarketplaceFilterBar({ resultCount }: { resultCount?: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const searchId = useId();
  const urlQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(urlQuery);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const pushParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const key of DROPPED_KEYS) params.delete(key);
      mutate(params);
      startTransition(() => {
        const qs = params.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  function update(key: string, value: string) {
    pushParams((params) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
  }

  function submitSearch() {
    const next = query.trim();
    pushParams((params) => {
      if (next) params.set("q", next);
      else params.delete("q");
    });
  }

  function clearSearch() {
    setQuery("");
    pushParams((params) => {
      params.delete("q");
    });
  }

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [];
    const q = searchParams.get("q");
    const industry = searchParams.get("industry");
    const deal = searchParams.get("dealValueBand");
    const province = searchParams.get("province");
    const sort = searchParams.get("sort");

    if (q) chips.push({ key: "q", label: `“${q}”` });
    if (industry) {
      chips.push({
        key: "industry",
        label: INDUSTRY_LABELS[industry as keyof typeof INDUSTRY_LABELS] ?? industry.replace(/_/g, " "),
      });
    }
    if (deal) {
      chips.push({
        key: "dealValueBand",
        label: DEAL_VALUE_BAND_LABELS[deal as keyof typeof DEAL_VALUE_BAND_LABELS] ?? deal,
      });
    }
    if (province) chips.push({ key: "province", label: province });
    if (sort === "asking_desc") chips.push({ key: "sort", label: "Asking: high to low" });
    if (sort === "asking_asc") chips.push({ key: "sort", label: "Asking: low to high" });
    if (sort === "newest") chips.push({ key: "sort", label: "Newest" });
    return chips;
  }, [searchParams]);

  const structuredFilterCount = activeChips.filter((chip) => chip.key !== "q").length;

  return (
    <CollapsibleDiscoverFilters
      pending={isPending}
      resultCount={resultCount}
      resultNoun={{ one: "business", many: "businesses" }}
      activeFilterCount={structuredFilterCount}
      search={
        <SearchField
          id={searchId}
          value={query}
          onChange={setQuery}
          onSubmit={submitSearch}
          onClear={clearSearch}
          placeholder="Search sector, place, or ID…"
        />
      }
      chips={
        activeChips.length > 0 ? (
          <FilterChips
            chips={activeChips}
            onRemove={(key) => {
              if (key === "q") clearSearch();
              else update(key, "");
            }}
            onClear={() => {
              setQuery("");
              startTransition(() => router.push(pathname, { scroll: false }));
            }}
          />
        ) : null
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FilterField label="Sector">
          <SelectField
            aria-label="Sector"
            className="h-10"
            value={searchParams.get("industry") || ""}
            onValueChange={(value) => update("industry", value)}
            options={[
              { value: "", label: "All sectors" },
              ...INDUSTRY_OPTIONS.map((i) => ({ value: i, label: INDUSTRY_LABELS[i] })),
            ]}
            wrapItems
          />
        </FilterField>
        <FilterField label="Deal value">
          <SelectField
            aria-label="Deal value"
            className="h-10"
            value={searchParams.get("dealValueBand") || ""}
            onValueChange={(value) => update("dealValueBand", value)}
            options={[
              { value: "", label: "Any deal value" },
              ...Object.entries(DEAL_VALUE_BAND_LABELS).map(([value, label]) => ({ value, label })),
            ]}
          />
        </FilterField>
        <FilterField label="Province">
          <SelectField
            aria-label="Province"
            className="h-10"
            value={searchParams.get("province") || ""}
            onValueChange={(value) => update("province", value)}
            options={[
              { value: "", label: "All provinces" },
              ...NEPAL_PROVINCES.map((p) => ({ value: p, label: p })),
            ]}
          />
        </FilterField>
        <FilterField label="Sort">
          <SelectField
            aria-label="Sort listings"
            className="h-10"
            value={searchParams.get("sort") || ""}
            onValueChange={(value) => update("sort", value)}
            options={[
              { value: "", label: "Newest" },
              { value: "asking_desc", label: "Asking: high to low" },
              { value: "asking_asc", label: "Asking: low to high" },
            ]}
          />
        </FilterField>
      </div>
    </CollapsibleDiscoverFilters>
  );
}

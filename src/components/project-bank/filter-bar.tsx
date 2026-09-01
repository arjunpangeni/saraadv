"use client";

import { useCallback, useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SelectField } from "@/components/ui/select-field";
import {
  CAPEX_RANGE_LABELS,
  CAPEX_RANGE_OPTIONS,
  FUNDING_STAGE_OPTIONS,
  PROJECT_SECTOR_LABELS,
  PROJECT_SECTOR_OPTIONS,
} from "@/types/project-bank";
import { cn } from "@/lib/utils";
import { FilterChips } from "@/components/marketing/discover-search";

export function ProjectBankFilterBar({ resultCount }: { resultCount?: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const pushParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      startTransition(() => {
        const qs = params.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname);
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

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [];
    const sector = searchParams.get("sector");
    const capex = searchParams.get("capexRange") || searchParams.get("capexBand");
    const stage = searchParams.get("fundingStage");
    if (sector) {
      chips.push({
        key: "sector",
        label: PROJECT_SECTOR_LABELS[sector as keyof typeof PROJECT_SECTOR_LABELS] ?? sector.replace(/_/g, " "),
      });
    }
    if (capex) {
      chips.push({
        key: "capexRange",
        label: CAPEX_RANGE_LABELS[capex as keyof typeof CAPEX_RANGE_LABELS] ?? capex,
      });
    }
    if (stage) {
      chips.push({
        key: "fundingStage",
        label: FUNDING_STAGE_OPTIONS.find((s) => s.value === stage)?.label ?? stage.replace(/_/g, " "),
      });
    }
    return chips;
  }, [searchParams]);

  function clearFilters() {
    startTransition(() => router.push(pathname));
  }

  return (
    <div className={cn("mb-6", isPending && "opacity-80")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SelectField
          aria-label="Sector"
          className="sm:w-56"
          value={searchParams.get("sector") || ""}
          onValueChange={(value) => update("sector", value)}
          options={[{ value: "", label: "All sectors" }, ...PROJECT_SECTOR_OPTIONS]}
          wrapItems
        />
        <SelectField
          aria-label="Investment size"
          className="sm:w-48"
          value={searchParams.get("capexRange") || searchParams.get("capexBand") || ""}
          onValueChange={(value) => {
            pushParams((params) => {
              params.delete("capexBand");
              if (value) params.set("capexRange", value);
              else params.delete("capexRange");
            });
          }}
          options={[{ value: "", label: "Any investment size" }, ...CAPEX_RANGE_OPTIONS]}
        />
        <SelectField
          aria-label="Funding stage"
          className="sm:w-48"
          value={searchParams.get("fundingStage") || ""}
          onValueChange={(value) => update("fundingStage", value)}
          options={[{ value: "", label: "Any stage" }, ...FUNDING_STAGE_OPTIONS]}
        />

        {typeof resultCount === "number" && (
          <p className="shrink-0 text-sm text-foreground/60 sm:ml-auto">
            <span className="font-semibold text-foreground">{resultCount}</span>{" "}
            {resultCount === 1 ? "project" : "projects"}
            {isPending ? " · updating…" : ""}
          </p>
        )}
      </div>

      {activeChips.length > 0 ? (
        <div className="mt-3">
          <FilterChips
            chips={activeChips}
            onRemove={(key) => update(key, "")}
            onClear={clearFilters}
          />
        </div>
      ) : null}
    </div>
  );
}

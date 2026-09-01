"use client";

import { FilterTabs } from "@/components/console/filter-tabs";

export type BusinessSetupCommandTab = "overview" | "checklist" | "activity";

const TABS: { id: BusinessSetupCommandTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "checklist", label: "Checklist" },
  { id: "activity", label: "Activity" },
];

export function BusinessSetupCommandTabs({
  setupId,
  active,
}: {
  setupId: string;
  active: BusinessSetupCommandTab;
}) {
  return (
    <FilterTabs
      className="mb-8 font-ui"
      items={TABS.map((tab) => ({
        href: `/advisor/business-setups/${setupId}?tab=${tab.id}`,
        label: tab.label,
        active: active === tab.id,
      }))}
    />
  );
}

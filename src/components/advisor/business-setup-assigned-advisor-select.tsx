"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SelectField } from "@/components/ui/select-field";

export function BusinessSetupAssignedAdvisorSelect({
  setupId,
  assignedAdvisorId,
  advisors,
}: {
  setupId: string;
  assignedAdvisorId: string | null;
  advisors: { id: string; name: string | null; email: string }[];
}) {
  const router = useRouter();
  const [value, setValue] = useState(assignedAdvisorId ?? "");
  const [loading, setLoading] = useState(false);

  async function onValueChange(next: string) {
    setValue(next);
    setLoading(true);
    await fetch(`/api/business-setup/${setupId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedAdvisorId: next || null }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <SelectField
      value={value}
      onValueChange={onValueChange}
      disabled={loading}
      className="w-auto min-w-[12rem]"
      options={[
        { value: "", label: "Unassigned" },
        ...advisors.map((a) => ({ value: a.id, label: a.name ?? a.email })),
      ]}
    />
  );
}

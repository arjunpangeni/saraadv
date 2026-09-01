"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SelectField } from "@/components/ui/select-field";
import { SETUP_PIPELINE_STATUSES } from "@/lib/business-setup-progress";

export function BusinessSetupStatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [loading, setLoading] = useState(false);

  async function onValueChange(next: string) {
    setValue(next);
    setLoading(true);
    await fetch(`/api/business-setup/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <SelectField
      value={value}
      onValueChange={onValueChange}
      disabled={loading}
      className="w-auto min-w-[10rem]"
      options={SETUP_PIPELINE_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
    />
  );
}

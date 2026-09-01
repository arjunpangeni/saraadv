"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { SelectField } from "@/components/ui/select-field";
import { DEAL_DESK_STATUS_OPTIONS } from "@/types/project-bank";

export function DealLeadStatusSelect({
  id,
  status,
  verified,
  kind,
}: {
  id: string;
  status: string;
  verified: boolean;
  kind: "buyer" | "investor";
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [loading, setLoading] = useState(false);
  const endpoint = kind === "buyer" ? `/api/listing-leads/${id}` : `/api/project-leads/${id}`;
  const options = DEAL_DESK_STATUS_OPTIONS.map((option) => ({
    ...option,
    disabled: !verified && option.value !== "NEW" && option.value !== "REJECTED",
  }));

  async function onValueChange(next: string) {
    if (!verified && next !== "NEW" && next !== "REJECTED") {
      toast.error(`Confirm the ${kind} email before advancing this lead.`);
      return;
    }
    setLoading(true);
    setValue(next);
    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    if (!res.ok) {
      setValue(status);
      const data = await res.json().catch(() => ({}));
      toast.error(typeof data.error === "string" ? data.error : "Unable to update lead status.");
      return;
    }
    toast.success("Lead status updated.");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <SelectField
        className="h-9 w-auto min-w-[10.5rem] text-xs"
        value={value}
        onValueChange={onValueChange}
        disabled={loading}
        aria-label="Update lead status"
        options={options}
      />
      {loading ? (
        <Badge variant="default" className="text-[10px]">
          Saving…
        </Badge>
      ) : null}
    </div>
  );
}

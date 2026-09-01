"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { SelectField } from "@/components/ui/select-field";
import { DEAL_DESK_STATUS_OPTIONS } from "@/types/project-bank";

interface LeadRowProps {
  id: string;
  status: string;
  verified: boolean;
}

export function ProjectLeadStatusSelect({ id, status, verified }: LeadRowProps) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [loading, setLoading] = useState(false);

  async function onValueChange(next: string) {
    if (!verified && next !== "NEW") {
      toast.error("Verify the investor email before advancing this lead.");
      return;
    }
    setLoading(true);
    setValue(next);
    const res = await fetch(`/api/project-leads/${id}`, {
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
    <div className="flex items-center gap-3">
      <SelectField
        className="w-auto min-w-[160px] text-xs"
        value={value}
        onValueChange={onValueChange}
        disabled={loading || !verified}
        aria-label="Update lead status"
        options={DEAL_DESK_STATUS_OPTIONS}
      />
      {loading && <Badge variant="default">Saving...</Badge>}
    </div>
  );
}

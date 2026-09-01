"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { SelectField } from "@/components/ui/select-field";
import { Badge } from "@/components/ui/badge";

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "IN_PROGRESS", "WON", "LOST"] as const;

export function CrmTicketStatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [loading, setLoading] = useState(false);

  async function onValueChange(next: string) {
    setLoading(true);
    setValue(next);
    const res = await fetch(`/api/crm-tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    if (!res.ok) {
      setValue(status);
      toast.error("Unable to update ticket status.");
      return;
    }
    toast.success("Ticket status updated.");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <SelectField
        className="w-auto min-w-[148px] text-xs h-9"
        value={value}
        onValueChange={onValueChange}
        disabled={loading}
        aria-label="Update ticket status"
        options={STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
      />
      {loading && (
        <Badge variant="default" className="text-[10px]">
          Saving…
        </Badge>
      )}
    </div>
  );
}

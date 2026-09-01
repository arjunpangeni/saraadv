"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import SmoothButton from "@/components/smoothui/smooth-button";
import { cn } from "@/lib/utils";

export function LeadAdminNotes({
  id,
  notes,
  saveUrl,
  field = "adminNotes",
  placeholder,
  className,
}: {
  id: string;
  notes: string | null;
  saveUrl?: string;
  field?: string;
  placeholder?: string;
  className?: string;
}) {
  const [value, setValue] = useState(notes ?? "");
  const [saved, setSaved] = useState(notes ?? "");
  const [loading, setLoading] = useState(false);
  const endpoint = saveUrl ?? `/api/project-leads/${id}`;
  const dirty = value !== saved;

  useEffect(() => {
    setValue(notes ?? "");
    setSaved(notes ?? "");
  }, [notes]);

  async function save() {
    if (!dirty) return;
    setLoading(true);
    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Unable to save notes.");
      return;
    }
    setSaved(value);
    toast.success("Notes saved.");
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Textarea
        placeholder={placeholder ?? "Desk notes (not visible to the investor)…"}
        className="min-h-[72px]"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <SmoothButton type="button" variant="outline" size="sm" disabled={loading || !dirty} onClick={() => void save()}>
        {loading ? "Saving…" : dirty ? "Save notes" : "Saved"}
      </SmoothButton>
    </div>
  );
}

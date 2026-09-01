"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUSES = ["PENDING", "IN_PROGRESS", "DONE", "NOT_APPLICABLE"] as const;

export function ComplianceTaskAdvisorRow({
  setupId,
  task,
  optional,
}: {
  setupId: string;
  task: {
    id: string;
    title: string;
    authority: string;
    code: string;
    status: string;
    notes: string | null;
    dueDate: Date | null;
    serviceRequestedAt: Date | null;
  };
  optional: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(task.status);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""
  );
  const [saving, setSaving] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    await fetch(`/api/business-setup/${setupId}/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    router.refresh();
  }

  async function onStatusChange(next: string) {
    setStatus(next);
    await patch({ status: next });
  }

  async function saveNotes() {
    await patch({ notes: notes.trim() || null });
  }

  async function onDueDateChange(next: string) {
    setDueDate(next);
    await patch({ dueDate: next ? new Date(next).toISOString() : null });
  }

  async function removeTask() {
    if (!confirm("Remove this checklist item?")) return;
    setSaving(true);
    await fetch(`/api/business-setup/${setupId}/tasks/${task.id}`, { method: "DELETE" });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="border border-border-subtle rounded-lg p-4 bg-surface-elevated space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-medium text-foreground">{task.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {task.authority} · {task.code}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {optional && <Badge variant="sky">Upsell</Badge>}
          {task.serviceRequestedAt && <Badge variant="warning">Service requested</Badge>}
          <SelectField
            value={status}
            onValueChange={onStatusChange}
            disabled={saving}
            className="w-auto min-w-[9rem] text-sm h-9"
            options={STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
          />
          <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={removeTask}>
            Remove
          </Button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Due date</label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
            disabled={saving}
            className="h-9 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Advisor notes</label>
          <div className="flex gap-2">
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal note"
              disabled={saving}
              className="h-9 text-sm"
            />
            <button
              type="button"
              onClick={saveNotes}
              disabled={saving}
              className="shrink-0 rounded-md border border-border-subtle px-3 text-xs font-medium text-muted-foreground hover:bg-surface-muted disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

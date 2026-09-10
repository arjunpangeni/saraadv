"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

type Rule = { code: string; title: string; authority: string; category: string };

export function ChecklistBuilder({
  setupId,
  rules,
  existingCodes,
}: {
  setupId: string;
  rules: Rule[];
  existingCodes: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [customTitle, setCustomTitle] = useState("");
  const [customAuthority, setCustomAuthority] = useState("ASAR Partners");
  const [customNotes, setCustomNotes] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const have = useMemo(() => new Set(existingCodes), [existingCodes]);
  const available = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return rules.filter((r) => {
      if (have.has(r.code)) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      );
    });
  }, [rules, have, filter]);

  async function post(body: unknown) {
    setLoading(JSON.stringify(body));
    setError(null);
    const res = await fetch(`/api/business-setup/${setupId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Action failed");
      return;
    }
    router.refresh();
  }

  function toggle(code: string) {
    setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-foreground">Build checklist</h3>
          <p className="text-sm text-muted-foreground">
            Generate from the rules engine, pick items from the library, or add a custom task.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="sky"
              size="sm"
              disabled={!!loading}
              onClick={() => post({ action: "generate", replace: existingCodes.length > 0 })}
            >
              {existingCodes.length > 0 ? "Regenerate from rules" : "Generate from rules"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5 space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="font-semibold text-foreground">Add from library</h3>
              <p className="text-sm text-muted-foreground mt-1">Select existing regulatory checklist items.</p>
            </div>
            <Input
              className="max-w-xs"
              placeholder="Filter rules…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="max-h-56 overflow-y-auto space-y-1.5 rounded-lg border border-border-subtle p-2">
            {available.length === 0 && (
              <p className="text-sm text-muted-foreground p-2">No matching library items left to add.</p>
            )}
            {available.map((r) => (
              <label
                key={r.code}
                className="flex gap-2 items-start rounded-md px-2 py-1.5 text-sm hover:bg-surface-muted cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selected.includes(r.code)}
                  onChange={() => toggle(r.code)}
                />
                <span>
                  <span className="font-medium text-foreground">{r.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {r.code} · {r.authority} · {r.category}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={selected.length === 0 || !!loading}
            onClick={() => {
              void post({ action: "add_library", codes: selected }).then(() => setSelected([]));
            }}
          >
            Add selected ({selected.length})
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-foreground">Add custom item</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Label>Title</Label>
              <Input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} />
            </div>
            <div>
              <Label>Authority</Label>
              <Input value={customAuthority} onChange={(e) => setCustomAuthority(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>Notes (optional)</Label>
              <Textarea value={customNotes} onChange={(e) => setCustomNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <Button
            type="button"
            variant="sky"
            size="sm"
            disabled={customTitle.trim().length < 2 || !!loading}
            onClick={() => {
              void post({
                action: "add_custom",
                title: customTitle,
                authority: customAuthority,
                notes: customNotes || undefined,
              }).then(() => {
                setCustomTitle("");
                setCustomNotes("");
              });
            }}
          >
            Add custom task
          </Button>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-danger-fg">{error}</p>}
    </div>
  );
}

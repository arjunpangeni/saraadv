"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/ui/select-field";
import SmoothButton from "@/components/smoothui/smooth-button";
import AnimatedTabs from "@/components/smoothui/animated-tabs";
import { ProjectReviewActions } from "@/components/advisor/project-review-actions";
import { NEPAL_PROVINCES, digitsOnly } from "@/lib/nepal-locations";
import {
  CAPEX_RANGE_OPTIONS,
  FUNDING_STAGE_OPTIONS,
  PROJECT_SECTOR_OPTIONS,
} from "@/types/project-bank";

type TeaserForm = {
  title: string;
  sector: string;
  broadRegion: string;
  elevatorPitch: string;
  capexRange: string;
  targetRoiIrr: string;
  fundingStage: string;
};

type ContactForm = {
  exactAddress: string;
  founderFullName: string;
  founderPhone: string;
};

export function ProjectReviewEditor({
  projectId,
  slug,
  status,
  editedByAdmin,
  initialTeaser,
  initialContact,
  loginEmail,
  imageUrls,
  redirectTo,
}: {
  projectId: string;
  slug: string;
  status: string;
  editedByAdmin: boolean;
  initialTeaser: TeaserForm;
  initialContact: ContactForm;
  loginEmail: string;
  imageUrls: string[];
  redirectTo?: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState("teaser");
  const [teaser, setTeaser] = useState(initialTeaser);
  const [contact, setContact] = useState(initialContact);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teaser,
        vault: {
          exactAddress: contact.exactAddress,
          founderFullName: contact.founderFullName,
          founderPhone: contact.founderPhone,
        },
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(typeof data.error === "string" ? data.error : "Unable to save.");
      return;
    }
    toast.success("Saved. Marked as edited by admin.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AnimatedTabs
          variant="pill"
          layoutId="project-review-layer"
          activeTab={tab}
          onChange={setTab}
          tabs={[
            { id: "teaser", label: "Teaser" },
            { id: "contact", label: "Advisor contact" },
          ]}
        />
        {editedByAdmin ? (
          <p className="text-xs font-medium text-warning-fg">Edited by admin</p>
        ) : null}
      </div>

      {tab === "teaser" ? (
        <div className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
          <p className="text-sm text-foreground/60">
            Public fields — title, sector, region, pitch, high-level financials, and 1–2 visuals.
          </p>
          {imageUrls.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {imageUrls.map((src) => (
                <div key={src} className="relative aspect-[16/10] overflow-hidden rounded-lg border border-border bg-surface-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-foreground/50">
              No visual assets uploaded.
            </p>
          )}
          <div className="space-y-1.5">
            <Label>Project title</Label>
            <Input value={teaser.title} onChange={(e) => setTeaser({ ...teaser, title: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Sector</Label>
              <SelectField
                value={teaser.sector}
                onValueChange={(sector) => setTeaser({ ...teaser, sector })}
                options={PROJECT_SECTOR_OPTIONS}
                wrapItems
              />
            </div>
            <div className="space-y-1.5">
              <Label>Location (broad region)</Label>
              <SelectField
                value={teaser.broadRegion}
                onValueChange={(broadRegion) => setTeaser({ ...teaser, broadRegion })}
                options={[
                  ...NEPAL_PROVINCES.map((p) => ({ value: `${p} Province`, label: `${p} Province` })),
                  ...(teaser.broadRegion &&
                  !NEPAL_PROVINCES.some((p) => `${p} Province` === teaser.broadRegion)
                    ? [{ value: teaser.broadRegion, label: teaser.broadRegion }]
                    : []),
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Estimated CAPEX</Label>
              <SelectField
                value={teaser.capexRange}
                onValueChange={(capexRange) => setTeaser({ ...teaser, capexRange })}
                options={CAPEX_RANGE_OPTIONS}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Funding stage</Label>
              <SelectField
                value={teaser.fundingStage}
                onValueChange={(fundingStage) => setTeaser({ ...teaser, fundingStage })}
                options={FUNDING_STAGE_OPTIONS}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Target IRR (%)</Label>
              <div className="relative">
                <Input
                  value={teaser.targetRoiIrr}
                  onChange={(e) => setTeaser({ ...teaser, targetRoiIrr: e.target.value })}
                  placeholder="15–18"
                  className="pr-10"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-foreground/50">
                  %
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Elevator pitch</Label>
            <Textarea
              rows={4}
              maxLength={500}
              value={teaser.elevatorPitch}
              onChange={(e) => setTeaser({ ...teaser, elevatorPitch: e.target.value })}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border border-warning/40 bg-warning-bg/20 p-4 sm:p-5">
          <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-warning-fg">
            <Lock className="size-3" /> Advisor-only — never shown on the public teaser
          </p>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              value={contact.founderFullName}
              onChange={(e) => setContact({ ...contact, founderFullName: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Login email</Label>
            <Input value={loginEmail} readOnly className="bg-surface-muted" />
            <p className="text-xs text-foreground/50">From the entrepreneur account. Not shown on the public teaser.</p>
          </div>
          <div className="space-y-1.5">
            <Label>WhatsApp / call</Label>
            <Input
              value={contact.founderPhone}
              onChange={(e) => setContact({ ...contact, founderPhone: digitsOnly(e.target.value, 10) })}
              placeholder="98XXXXXXXX"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Real location</Label>
            <Textarea
              rows={3}
              value={contact.exactAddress}
              onChange={(e) => setContact({ ...contact, exactAddress: e.target.value })}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SmoothButton variant="outline" disabled={saving} onClick={() => void save()}>
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Saving
            </>
          ) : (
            "Save edits"
          )}
        </SmoothButton>
        <ProjectReviewActions
          projectId={projectId}
          slug={slug}
          status={status}
          title={teaser.title}
          redirectTo={redirectTo ?? "/advisor/project-bank"}
        />
      </div>
    </div>
  );
}

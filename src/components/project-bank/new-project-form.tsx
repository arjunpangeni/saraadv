"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { Check, Lock, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/ui/select-field";
import { FormError } from "@/components/ui/status-banner";
import SmoothButton from "@/components/smoothui/smooth-button";
import { ProjectSubmitSuccessDialog } from "@/components/project-bank/project-submit-success-dialog";
import { cn } from "@/lib/utils";
import { NEPAL_MOBILE, NEPAL_PROVINCES, digitsOnly } from "@/lib/nepal-locations";
import {
  CAPEX_RANGE_OPTIONS,
  FUNDING_STAGE_OPTIONS,
  PROJECT_SECTOR_OPTIONS,
  capexLabel,
  irrLabel,
  sectorLabel,
  stageLabel,
} from "@/types/project-bank";

const MAX_IMAGES = 2;
const PITCH_MIN = 40;
const PITCH_MAX = 500;
const IMAGE_MAX_BYTES = 2 * 1024 * 1024;
const IRR_PATTERN = /^\d{1,2}(\.\d{1,2})?(\s*[–-]\s*\d{1,2}(\.\d{1,2})?)?%?$/;
const CAN_SUBMIT_ROLES = new Set(["ENTREPRENEUR", "ADVISOR", "ADMIN"]);
const STEPS = ["Teaser", "Contact"] as const;

function FieldGroup({
  title,
  description,
  vault,
  children,
}: {
  title: string;
  description?: string;
  vault?: boolean;
  children: ReactNode;
}) {
  return (
    <fieldset className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <legend className="flex items-center gap-1.5 px-1 font-display text-base font-extrabold tracking-tight text-foreground">
        {vault ? <Lock className="size-3.5 text-foreground/55" aria-hidden /> : null}
        {title}
      </legend>
      {description ? <p className="mb-4 text-sm leading-relaxed text-foreground/60">{description}</p> : null}
      {children}
    </fieldset>
  );
}

function fieldInvalid(error: string | null, label: string) {
  return Boolean(error?.startsWith(`${label}:`));
}

export function NewProjectForm() {
  const { data: session, status } = useSession();
  const [step, setStep] = useState(0);
  const [teaser, setTeaser] = useState({
    title: "",
    sector: "",
    broadRegion: "",
    elevatorPitch: "",
    capexRange: "",
    targetRoiIrr: "",
    fundingStage: "",
  });
  const [vault, setVault] = useState({
    exactAddress: "",
    founderFullName: "",
    founderPhone: "",
  });
  const [imageKeys, setImageKeys] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<{ title: string; slug?: string } | null>(null);

  const role = session?.user?.role;
  const canSubmit = status === "authenticated" && role && CAN_SUBMIT_ROLES.has(role);
  const pitchLen = teaser.elevatorPitch.length;
  const pitchValid = pitchLen >= PITCH_MIN && pitchLen <= PITCH_MAX;
  const pitchHint = pitchValid
    ? `${pitchLen}/${PITCH_MAX}`
    : pitchLen === 0
      ? `At least ${PITCH_MIN} characters`
      : `${PITCH_MIN - pitchLen} more · ${pitchLen}/${PITCH_MAX}`;

  useEffect(() => {
    const name = session?.user?.name?.trim();
    setVault((prev) => ({
      ...prev,
      founderFullName: prev.founderFullName || name || "",
    }));
  }, [session?.user?.name]);

  async function uploadFile(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/projects/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Upload failed.");
    return data.key as string;
  }

  async function uploadImages(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const incoming = Array.from(files);
    let keys = imageKeys;
    let shots = previews;
    setUploading(true);
    for (const file of incoming) {
      if (keys.length >= MAX_IMAGES) {
        setError("Visual assets: you can upload up to 2 images.");
        break;
      }
      if (file.size > IMAGE_MAX_BYTES) {
        setError("Visual assets: each image must be under 2 MB.");
        continue;
      }
      try {
        const key = await uploadFile(file);
        keys = [...keys, key].slice(0, MAX_IMAGES);
        shots = [...shots, URL.createObjectURL(file)].slice(0, MAX_IMAGES);
        setImageKeys(keys);
        setPreviews(shots);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Visual assets: image upload failed.");
        break;
      }
    }
    setUploading(false);
  }

  function teaserError() {
    if (teaser.title.trim().length < 3) return "Project title: enter at least 3 characters.";
    if (!teaser.sector) return "Sector: choose a sector.";
    if (!teaser.broadRegion) return "Location: choose a province.";
    if (!pitchValid) return "Elevator pitch: write 2–3 sentences (40–500 characters).";
    if (!teaser.capexRange) return "Estimated CAPEX: choose a range.";
    if (!teaser.fundingStage) return "Funding stage: choose a stage.";
    if (!IRR_PATTERN.test(teaser.targetRoiIrr.trim())) {
      return "Target IRR: enter a return like 18 or 15–18.";
    }
    if (imageKeys.length < 1) return "Visual assets: add 1–2 concept images.";
    return null;
  }

  function vaultError() {
    if (vault.founderFullName.trim().length < 2) return "Name: enter your full name.";
    if (!NEPAL_MOBILE.test(vault.founderPhone.trim())) {
      return "WhatsApp / call: enter a 10-digit Nepal mobile starting with 97 or 98.";
    }
    if (vault.exactAddress.trim().length < 8) return "Real location: enter the exact site address.";
    return null;
  }

  const teaserReady = teaserError() === null;

  function goToStep(next: number) {
    if (next === step) return;
    if (next > 0) {
      const block = teaserError();
      if (block) {
        setError(block);
        setStep(0);
        return;
      }
    }
    setError(null);
    setStep(next);
  }

  async function onSubmit() {
    if (!canSubmit) return;
    const teaserMsg = teaserError();
    if (teaserMsg) {
      setError(teaserMsg);
      setStep(0);
      return;
    }
    const vaultMsg = vaultError();
    if (vaultMsg) {
      setError(vaultMsg);
      setStep(1);
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...teaser,
        visualAssetKeys: imageKeys,
        vault,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message =
        typeof data.error === "string"
          ? data.error
          : res.status === 403
            ? "You need an Entrepreneur, Advisor, or Admin account to submit."
            : "Unable to submit. Please check your inputs and try again.";
      setError(message);
      if (/title|irr|pitch|region|location|visual|capex|sector|stage/i.test(message)) setStep(0);
      else setStep(1);
      return;
    }
    const data = await res.json().catch(() => ({}));
    setSubmitted({
      title: teaser.title.trim(),
      slug: typeof data.slug === "string" ? data.slug : undefined,
    });
  }

  return (
    <div className="container-console mx-auto max-w-3xl pt-12 pb-8 sm:pt-16 sm:pb-10">
      <ProjectSubmitSuccessDialog
        open={Boolean(submitted)}
        title={submitted?.title ?? ""}
        slug={submitted?.slug}
      />

      <ol className="mb-6 flex gap-2">
        {STEPS.map((label, i) => {
          const done = i === 0 ? teaserReady : false;
          const current = i === step;
          const locked = i > 0 && !teaserReady;
          return (
            <li key={label} className="flex-1">
              <button
                type="button"
                onClick={() => goToStep(i)}
                disabled={locked}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-semibold sm:text-sm",
                  current
                    ? "border-brand-sky bg-brand-sky-muted text-brand-sky"
                    : done
                      ? "border-border bg-card text-foreground"
                      : "border-border bg-card text-foreground/60",
                  locked && "cursor-not-allowed opacity-60"
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px]",
                    current
                      ? "bg-brand-sky text-white"
                      : done
                        ? "bg-success-bg text-success-fg"
                        : "bg-surface-muted text-foreground/60"
                  )}
                >
                  {done && !current ? <Check className="size-3" aria-hidden /> : i + 1}
                </span>
                {label}
              </button>
            </li>
          );
        })}
      </ol>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step === 0) {
            const next = teaserError();
            if (next) {
              setError(next);
              return;
            }
            setError(null);
            setStep(1);
            return;
          }
          void onSubmit();
        }}
      >
        {step === 0 && (
          <FieldGroup title="Public teaser">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Project title</Label>
                <Input
                  id="title"
                  required
                  minLength={3}
                  placeholder="e.g. Eco-Birthing Center & Maternal Retreat"
                  value={teaser.title}
                  aria-invalid={fieldInvalid(error, "Project title")}
                  onChange={(e) => setTeaser({ ...teaser, title: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Sector</Label>
                  <SelectField
                    value={teaser.sector}
                    onValueChange={(sector) => setTeaser({ ...teaser, sector })}
                    placeholder="Choose a sector"
                    options={PROJECT_SECTOR_OPTIONS}
                    wrapItems
                    aria-label="Sector"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <SelectField
                    value={teaser.broadRegion}
                    onValueChange={(broadRegion) => setTeaser({ ...teaser, broadRegion })}
                    placeholder="Choose a province"
                    aria-label="Location"
                    options={[
                      ...NEPAL_PROVINCES.map((p) => ({
                        value: `${p} Province`,
                        label: `${p} Province`,
                      })),
                      ...(teaser.broadRegion &&
                      !NEPAL_PROVINCES.some((p) => `${p} Province` === teaser.broadRegion)
                        ? [{ value: teaser.broadRegion, label: teaser.broadRegion }]
                        : []),
                    ]}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pitch">Elevator pitch</Label>
                <Textarea
                  id="pitch"
                  required
                  minLength={PITCH_MIN}
                  maxLength={PITCH_MAX}
                  rows={4}
                  placeholder="2–3 sentences: the vision, the problem it solves, and why it is profitable."
                  value={teaser.elevatorPitch}
                  aria-invalid={fieldInvalid(error, "Elevator pitch")}
                  onChange={(e) => setTeaser({ ...teaser, elevatorPitch: e.target.value })}
                />
                <p className={cn("text-right text-xs", pitchValid ? "text-success-fg" : "text-foreground/50")}>
                  {pitchHint}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Estimated CAPEX</Label>
                  <SelectField
                    value={teaser.capexRange}
                    onValueChange={(capexRange) => setTeaser({ ...teaser, capexRange })}
                    placeholder="Choose a range"
                    options={CAPEX_RANGE_OPTIONS}
                    aria-label="Estimated CAPEX"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Funding stage</Label>
                  <SelectField
                    value={teaser.fundingStage}
                    onValueChange={(fundingStage) => setTeaser({ ...teaser, fundingStage })}
                    placeholder="Choose a stage"
                    options={FUNDING_STAGE_OPTIONS}
                    aria-label="Funding stage"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="irr">Target IRR</Label>
                  <div className="relative">
                    <Input
                      id="irr"
                      placeholder="18 or 15–18"
                      value={teaser.targetRoiIrr}
                      aria-invalid={fieldInvalid(error, "Target IRR")}
                      onChange={(e) => setTeaser({ ...teaser, targetRoiIrr: e.target.value })}
                      className="pr-10"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-foreground/50">
                      %
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Visual assets</Label>
                <p className="text-xs text-foreground/50">JPEG, PNG, or WebP · max 2 MB · 1–2 concept images</p>
                {previews.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {previews.map((src, i) => (
                      <div key={src} className="relative aspect-[16/10] overflow-hidden rounded-lg border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setImageKeys((prev) => prev.filter((_, idx) => idx !== i));
                            setPreviews((prev) => {
                              URL.revokeObjectURL(prev[i]);
                              return prev.filter((_, idx) => idx !== i);
                            });
                          }}
                          className="absolute top-2 right-2 rounded-full bg-slate-900/70 p-1.5 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-sky"
                          aria-label={`Remove image ${i + 1}`}
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {imageKeys.length < MAX_IMAGES && (
                  <label
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-foreground/60 transition-colors hover:border-brand-sky hover:text-foreground",
                      uploading && "pointer-events-none opacity-60"
                    )}
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="sr-only"
                      disabled={uploading}
                      onChange={(e) => {
                        void uploadImages(e.target.files);
                        e.target.value = "";
                      }}
                    />
                    {uploading ? "Uploading…" : imageKeys.length === 0 ? "Add 1–2 images" : "Add another image"}
                  </label>
                )}
              </div>
            </div>
          </FieldGroup>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <FieldGroup vault title="Desk contact">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={vault.founderFullName}
                    aria-invalid={fieldInvalid(error, "Name")}
                    onChange={(e) => setVault({ ...vault, founderFullName: e.target.value })}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" value={session?.user?.email ?? ""} readOnly className="bg-surface-muted" />
                  <p className="text-xs text-foreground/50">Taken from your login.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">WhatsApp / call</Label>
                  <Input
                    id="phone"
                    value={vault.founderPhone}
                    aria-invalid={fieldInvalid(error, "WhatsApp / call")}
                    onChange={(e) => setVault({ ...vault, founderPhone: digitsOnly(e.target.value, 10) })}
                    placeholder="98XXXXXXXX"
                  />
                  <p className="text-xs text-foreground/50">10-digit Nepal mobile starting with 97 or 98.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="address">Real location</Label>
                  <Textarea
                    id="address"
                    rows={3}
                    value={vault.exactAddress}
                    aria-invalid={fieldInvalid(error, "Real location")}
                    onChange={(e) => setVault({ ...vault, exactAddress: e.target.value })}
                    placeholder="Exact site address — the desk uses this, it is not published"
                  />
                </div>
              </div>
            </FieldGroup>

            <button
              type="button"
              onClick={() => goToStep(0)}
              className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-brand-sky"
            >
              <p className="text-xs font-semibold tracking-wide text-brand-sky uppercase">Investors will see</p>
              <h3 className="mt-2 font-display text-lg font-extrabold">{teaser.title || "Untitled"}</h3>
              <p className="mt-1 text-sm text-foreground/60">
                {sectorLabel(teaser.sector)} · {teaser.broadRegion || "Region"} · {stageLabel(teaser.fundingStage)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-foreground/70">{teaser.elevatorPitch}</p>
              <p className="mt-3 text-sm font-semibold">
                {capexLabel(teaser.capexRange)} · {teaser.targetRoiIrr ? irrLabel(teaser.targetRoiIrr) : "IRR %"}
              </p>
              {previews.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {previews.map((src) => (
                    <div key={src} className="aspect-[16/10] overflow-hidden rounded-lg border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-foreground/50">No visuals yet</p>
              )}
              <p className="mt-3 text-xs font-medium text-brand-sky">Edit teaser</p>
            </button>
          </div>
        )}

        <FormError className="mt-4">{error}</FormError>
        {uploading ? (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-foreground/60">
            <Loader2 className="size-3 animate-spin" /> Uploading…
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <SmoothButton
            type="button"
            variant="outline"
            disabled={step === 0}
            onClick={() => {
              setError(null);
              setStep(0);
            }}
          >
            Back
          </SmoothButton>
          <SmoothButton type="submit" variant="candy" disabled={!canSubmit || uploading || loading}>
            {step === 0 ? "Continue" : loading ? "Submitting…" : "Submit for review"}
          </SmoothButton>
        </div>
      </form>
    </div>
  );
}

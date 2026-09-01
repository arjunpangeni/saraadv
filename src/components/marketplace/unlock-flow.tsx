"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/status-banner";
import { SCRUTINY_CTA_LABEL } from "@/types/listing";

const SERVICES = [
  {
    key: "DUE_DILIGENCE_AUDIT",
    label: "Independent Financial Due Diligence & Auditing",
    hint: "SARA verifies seller books against physical assets.",
  },
  {
    key: "LEGAL_STRUCTURING",
    label: "Legal Structuring & Asset/Share Transfer Management",
    hint: "SPA drafting, closings, and OCR share transfers.",
  },
  {
    key: "TAX_OPTIMIZATION",
    label: "Fiscal & Tax Optimization Structuring",
    hint: "Minimize Capital Gains Tax for both counterparties.",
  },
  {
    key: "POST_ACQUISITION_INTEGRATION",
    label: "Post-Acquisition Operational Integration & Turnaround",
    hint: "Integration and turnaround after close.",
  },
] as const;

export function UnlockFlow({ listingId, hashId }: { listingId: string; hashId: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"nda" | "checklist" | "done">("nda");
  const [selected, setSelected] = useState<string[]>([]);
  const [optOut, setOptOut] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signNda() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/listings/${listingId}/nda`, { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = data.error || "Unable to sign the NDA. Please sign in and try again.";
      setError(message);
      toast.error(message);
      return;
    }
    toast.success("NDA signed.");
    setStep("checklist");
  }

  function toggleService(key: string) {
    setOptOut(false);
    setSelected((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  }

  async function submitUnlock() {
    if (selected.length === 0 && !optOut) {
      setError("Select at least one advisory service, or check the box below to proceed without SARA services.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/listings/${listingId}/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ servicesSelected: selected, advisoryOptOut: optOut }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = data.error || "Unable to submit your request. Please try again.";
      setError(message);
      toast.error(message);
      return;
    }
    toast.success("Unlock request sent to the deal desk.");
    setStep("done");
  }

  if (step === "done") {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-[var(--shadow-card)] sm:p-10">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-success-fg">
          <Check className="size-7" />
        </div>
        <h2 className="font-display text-xl font-extrabold tracking-tight text-foreground">Request submitted</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Your full profile request for <span className="font-mono font-medium">{hashId}</span> is with the SARA
          Advisors deal desk. An advisor will follow up shortly.
        </p>
        <Button className="mt-8" variant="sky" onClick={() => router.push(`/marketplace/${hashId}`)}>
          View listing
        </Button>
      </div>
    );
  }

  if (step === "checklist") {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
        <p className="text-[11px] font-semibold tracking-wide text-brand-sky uppercase">Advisory checklist</p>
        <h2 className="mt-1 font-display text-xl font-extrabold tracking-tight text-foreground">
          Request full profile & quote
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Select the SARA M&A services you want quoted alongside data-room access for{" "}
          <span className="font-mono">{hashId}</span>.
        </p>
        <div className="mt-5 space-y-3">
          {SERVICES.map((s) => (
            <label
              key={s.key}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-border-subtle p-4 transition-colors hover:border-brand-sky/50 hover:bg-brand-sky-muted/60 has-[:checked]:border-brand-sky has-[:checked]:bg-brand-sky-muted"
            >
              <input
                type="checkbox"
                className="mt-1 rounded border-border-subtle text-brand-sky focus:ring-brand-sky"
                checked={selected.includes(s.key)}
                onChange={() => toggleService(s.key)}
              />
              <span>
                <span className="block text-sm font-medium text-foreground">{s.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{s.hint}</span>
              </span>
            </label>
          ))}
        </div>

        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-dashed border-border-subtle p-4 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={optOut}
            onChange={(e) => {
              setOptOut(e.target.checked);
              if (e.target.checked) setSelected([]);
            }}
          />
          I do not require SARA advisory services at this time — profile access only.
        </label>

        <FormError className="mt-4">{error}</FormError>
        <Button
          className="mt-6 h-auto w-full whitespace-normal py-3 leading-snug"
          variant="sky"
          size="lg"
          onClick={submitUnlock}
          disabled={loading}
        >
          {loading ? "Submitting…" : SCRUTINY_CTA_LABEL}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
      <p className="text-[11px] font-semibold tracking-wide text-brand-sky uppercase">NDA gatekeeper</p>
      <h2 className="mt-1 font-display text-xl font-extrabold tracking-tight text-foreground">
        Non-Disclosure Agreement
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Listing <span className="font-mono">{hashId}</span> — required before accessing confidential data.
      </p>
      <div className="mt-5 max-h-64 overflow-y-auto rounded-xl border bg-background p-5 text-sm leading-relaxed text-muted-foreground">
        <p>
          By proceeding, you agree to keep confidential all information disclosed regarding this business
          opportunity, including financial statements, asset valuations, and regulatory attachments. You agree
          not to disclose, copy, or use this information for any purpose other than evaluating a potential
          transaction facilitated by SARA Advisors.
        </p>
        <p className="mt-3">A signed PDF copy of this agreement will be stored for your records. Binding period: 24 months.</p>
      </div>
      <FormError className="mt-4">{error}</FormError>
      <Button className="mt-6 w-full" variant="sky" size="lg" onClick={signNda} disabled={loading}>
        {loading ? "Signing…" : "I Agree — Execute NDA & Continue"}
      </Button>
    </div>
  );
}

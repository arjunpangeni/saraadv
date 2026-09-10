"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, Lock, Mail, Phone, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/status-banner";
import { SelectField } from "@/components/ui/select-field";
import SmoothButton from "@/components/smoothui/smooth-button";
import { ListingLeadSubmitted } from "@/components/marketplace/listing-lead-submitted";
import { INVESTOR_TYPE_OPTIONS, INVESTMENT_TIMEFRAME_OPTIONS } from "@/types/project-bank";
import { sanitizePhoneInput } from "@/lib/phone";
import { cn } from "@/lib/utils";

function Field({
  id,
  label,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-xs leading-relaxed text-foreground/50">{hint}</p> : null}
    </div>
  );
}

function IconInput({
  icon: Icon,
  className,
  ...props
}: ComponentProps<typeof Input> & { icon: typeof Mail }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground/40" aria-hidden />
      <Input className={cn("pl-10", className)} {...props} />
    </div>
  );
}

type SubmittedState = {
  name: string;
  email: string;
  hashId: string;
};

export function ListingLeadForm({
  listingId,
  hashId,
  prefill,
  inlineSuccess = false,
  onSubmitted,
}: {
  listingId: string;
  hashId: string;
  prefill?: {
    name?: string;
    firm?: string;
    email?: string;
    phone?: string;
    investorType?: string;
    investmentTimeframe?: string;
  };
  inlineSuccess?: boolean;
  onSubmitted?: (data: SubmittedState) => void;
}) {
  const router = useRouter();
  const rememberedEmail = Boolean(prefill?.email);
  const [form, setForm] = useState({
    name: prefill?.name ?? "",
    firm: prefill?.firm ?? "",
    email: prefill?.email ?? "",
    phone: prefill?.phone ?? "",
    investorType: prefill?.investorType ?? "INDIVIDUAL_ANGEL",
    investmentTimeframe: prefill?.investmentTimeframe ?? "EXPLORING",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<SubmittedState | null>(null);

  function finishSubmission(next: SubmittedState) {
    if (inlineSuccess || onSubmitted) {
      setSubmitted(next);
      onSubmitted?.(next);
      return;
    }
    const params = new URLSearchParams({
      email: next.email,
      listing: next.hashId,
    });
    router.push(`/marketplace/request/check-email?${params.toString()}`);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/listings/${listingId}/lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      const message =
        typeof data.error === "string" ? data.error : "Unable to send the confirmation link. Please try again.";
      setError(message);
      toast.error(message);
      return;
    }
    if (data.alreadyVerified) {
      if (inlineSuccess || onSubmitted) {
        finishSubmission({ name: form.name, email: form.email, hashId });
        return;
      }
      router.push(`/marketplace/verify?already=1&listing=${encodeURIComponent(hashId)}`);
      return;
    }
    finishSubmission({ name: form.name, email: form.email, hashId });
  }

  if (submitted) {
    return (
      <ListingLeadSubmitted
        compact
        name={submitted.name}
        email={submitted.email}
        hashId={submitted.hashId}
        listingId={listingId}
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="rounded-xl border border-border bg-surface-muted/60 px-3.5 py-3">
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground/70">
          <Mail className="size-3.5 text-brand-sky" aria-hidden />
          We send a one-time link to your work email. No password.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="buyer-name" label="Full name">
          <IconInput
            icon={UserRound}
            id="buyer-name"
            required
            minLength={2}
            autoComplete="name"
            placeholder="Your name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field
          id="buyer-email"
          label="Work email"
          hint={rememberedEmail ? "Confirmed for 24 hours on this browser." : undefined}
        >
          <IconInput
            icon={Mail}
            id="buyer-email"
            type="email"
            required
            readOnly={rememberedEmail}
            autoComplete="email"
            placeholder="you@firm.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field id="buyer-firm" label="Firm or family office">
          <IconInput
            icon={Building2}
            id="buyer-firm"
            required
            minLength={2}
            autoComplete="organization"
            placeholder="Organisation"
            value={form.firm}
            onChange={(e) => setForm({ ...form, firm: e.target.value })}
          />
        </Field>
        <Field id="buyer-phone" label="Phone / WhatsApp">
          <IconInput
            icon={Phone}
            id="buyer-phone"
            type="tel"
            inputMode="tel"
            required
            autoComplete="tel"
            placeholder="+1 415 555 0100"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: sanitizePhoneInput(e.target.value) })}
          />
        </Field>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold tracking-wide text-foreground/45 uppercase">
          Your interest
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="buyer-type" label="Buyer type">
            <SelectField
              id="buyer-type"
              wrapItems
              value={form.investorType}
              onValueChange={(investorType) => setForm({ ...form, investorType })}
              options={INVESTOR_TYPE_OPTIONS}
            />
          </Field>
          <Field id="buyer-time" label="Timeframe">
            <SelectField
              id="buyer-time"
              wrapItems
              value={form.investmentTimeframe}
              onValueChange={(investmentTimeframe) => setForm({ ...form, investmentTimeframe })}
              options={INVESTMENT_TIMEFRAME_OPTIONS}
            />
          </Field>
        </div>
      </div>

      <FormError>{error}</FormError>

      <div className="space-y-2.5">
        <SmoothButton type="submit" variant="candy" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Sending link…
            </>
          ) : (
            "Email me a confirmation link"
          )}
        </SmoothButton>
        <p className="inline-flex items-start gap-1.5 text-xs leading-relaxed text-foreground/50">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          After you confirm your email, ASAR Partners vet the request, arrange an NDA, and share the data room
          offline. No buyer account is required.
        </p>
      </div>
    </form>
  );
}

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
import { INVESTOR_TYPE_OPTIONS, INVESTMENT_TIMEFRAME_OPTIONS } from "@/types/project-bank";
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

export function ProjectLeadForm({ projectId, projectSlug }: { projectId: string; projectSlug: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    firm: "",
    email: "",
    phone: "",
    investorType: "INDIVIDUAL_ANGEL",
    investmentTimeframe: "EXPLORING",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/projects/${projectId}/lead`, {
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
      router.push(`/project-bank/verify?already=1&project=${encodeURIComponent(projectSlug)}`);
      return;
    }
    const params = new URLSearchParams({
      email: form.email,
      project: projectSlug,
    });
    router.push(`/project-bank/request/check-email?${params.toString()}`);
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
        <Field id="lead-name" label="Full name">
          <IconInput
            icon={UserRound}
            id="lead-name"
            required
            minLength={2}
            autoComplete="name"
            placeholder="Your name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field id="lead-email" label="Work email">
          <IconInput
            icon={Mail}
            id="lead-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@firm.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field id="lead-firm" label="Firm or family office">
          <IconInput
            icon={Building2}
            id="lead-firm"
            required
            minLength={2}
            autoComplete="organization"
            placeholder="Organisation"
            value={form.firm}
            onChange={(e) => setForm({ ...form, firm: e.target.value })}
          />
        </Field>
        <Field id="lead-phone" label="Phone / WhatsApp">
          <IconInput
            icon={Phone}
            id="lead-phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="+977 98XXXXXXXX"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </Field>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold tracking-wide text-foreground/45 uppercase">
          Your interest
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="lead-type" label="Investor type">
            <SelectField
              id="lead-type"
              wrapItems
              value={form.investorType}
              onValueChange={(investorType) => setForm({ ...form, investorType })}
              options={INVESTOR_TYPE_OPTIONS}
            />
          </Field>
          <Field id="lead-time" label="Timeframe">
            <SelectField
              id="lead-time"
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
          After you confirm, SARA Advisors vet the request, arrange an NDA, and share the dossier
          offline. This form is not shown on the public teaser.
        </p>
      </div>
    </form>
  );
}

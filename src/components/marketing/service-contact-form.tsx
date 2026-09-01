"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import { FormError } from "@/components/ui/status-banner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import SmoothButton from "@/components/smoothui/smooth-button";
import type { ServiceInquiryTopic } from "@/lib/service-inquiries";
import { NEPAL_MOBILE, digitsOnly, isValidEmail } from "@/lib/nepal-locations";

export function ServiceContactForm({
  type,
  title,
  subtitle,
  placeholder,
  uncarded = false,
  compact = false,
  defaultSubject = "",
  onSuccess,
}: {
  type: ServiceInquiryTopic;
  title: string;
  subtitle: string;
  placeholder?: string;
  uncarded?: boolean;
  compact?: boolean;
  defaultSubject?: string;
  onSuccess?: () => void;
}) {
  const id = useId();
  const [fields, setFields] = useState({
    contactName: "",
    phone: "",
    email: "",
    subject: defaultSubject,
    message: "",
    website: "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; email?: string }>({});

  function validatePhoneField(value: string): string | null {
    if (!value) return "Phone number is required.";
    if (!NEPAL_MOBILE.test(value)) return "Enter a 10-digit mobile starting with 97 or 98.";
    return null;
  }

  function validateEmailField(value: string): string | null {
    if (!value.trim()) return "Email is required.";
    if (!isValidEmail(value)) return "Enter a valid email (e.g. you@example.com).";
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const phoneError = validatePhoneField(fields.phone);
    const emailError = validateEmailField(fields.email);
    setFieldErrors({ phone: phoneError ?? undefined, email: emailError ?? undefined });
    if (phoneError || emailError) {
      setError(phoneError || emailError);
      toast.error(phoneError || emailError);
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/service-inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ...fields }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = typeof data.error === "string" ? data.error : "Unable to send. Please try again.";
      setError(message);
      toast.error(message);
      return;
    }
    setDone(true);
    onSuccess?.();
  }

  if (done) {
    const thanks = (
      <div className={uncarded ? "py-2" : "text-center"}>
        <h3 className="font-display text-xl font-semibold text-foreground">Thank you</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your message was received. The SARA Advisors team will follow up by message or call.
        </p>
      </div>
    );
    if (uncarded) return thanks;
    return (
      <Card>
        <CardContent className="pt-6">{thanks}</CardContent>
      </Card>
    );
  }

  const nameId = `${id}-name`;
  const phoneId = `${id}-phone`;
  const emailId = `${id}-email`;
  const subjectId = `${id}-subject`;
  const messageId = `${id}-message`;
  const websiteId = `${id}-website`;

  const body = (
    <form onSubmit={onSubmit} className={compact ? "relative space-y-3" : "relative space-y-4"}>
      {!uncarded && (
        <div className="mb-2">
          <h3 className="font-display text-xl font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      )}
      <div className={compact ? "grid gap-3 sm:grid-cols-2" : "grid gap-4 sm:grid-cols-2"}>
        <div className="space-y-1.5">
          <Label htmlFor={nameId}>Your name *</Label>
          <Input
            id={nameId}
            required
            autoComplete="name"
            value={fields.contactName}
            onChange={(e) => setFields({ ...fields, contactName: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={phoneId}>Phone *</Label>
          <Input
            id={phoneId}
            required
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={10}
            value={fields.phone}
            aria-invalid={Boolean(fieldErrors.phone)}
            onChange={(e) => {
              const phone = digitsOnly(e.target.value, 10);
              setFields({ ...fields, phone });
              setFieldErrors((prev) => ({
                ...prev,
                phone: phone.length === 10 ? validatePhoneField(phone) ?? undefined : undefined,
              }));
            }}
            onBlur={() =>
              setFieldErrors((prev) => ({ ...prev, phone: validatePhoneField(fields.phone) ?? undefined }))
            }
          />
          {fieldErrors.phone ? <p className="text-xs text-destructive">{fieldErrors.phone}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={emailId}>Email *</Label>
          <Input
            id={emailId}
            required
            type="email"
            autoComplete="email"
            value={fields.email}
            aria-invalid={Boolean(fieldErrors.email)}
            onChange={(e) => {
              const email = e.target.value;
              setFields({ ...fields, email });
              if (fieldErrors.email) {
                setFieldErrors((prev) => ({ ...prev, email: validateEmailField(email) ?? undefined }));
              }
            }}
            onBlur={() =>
              setFieldErrors((prev) => ({ ...prev, email: validateEmailField(fields.email) ?? undefined }))
            }
          />
          {fieldErrors.email ? <p className="text-xs text-destructive">{fieldErrors.email}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={subjectId}>Subject</Label>
          <Input
            id={subjectId}
            value={fields.subject}
            onChange={(e) => setFields({ ...fields, subject: e.target.value })}
            placeholder={placeholder ?? "e.g. Advisory for a Nepal investment"}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={messageId}>Message *</Label>
        <Textarea
          id={messageId}
          required
          rows={compact ? 3 : 4}
          value={fields.message}
          onChange={(e) => setFields({ ...fields, message: e.target.value })}
          placeholder="Tell us briefly about your project or situation…"
        />
      </div>
      <div className="absolute -left-[9999px] h-0 overflow-hidden opacity-0" aria-hidden>
        <Label htmlFor={websiteId}>Website</Label>
        <Input
          id={websiteId}
          tabIndex={-1}
          autoComplete="off"
          value={fields.website}
          onChange={(e) => setFields({ ...fields, website: e.target.value })}
        />
      </div>
      <FormError>{error}</FormError>
      <SmoothButton type="submit" variant="candy" size={compact ? "sm" : "default"} disabled={loading}>
        {loading ? "Sending…" : "Send to SARA team"}
      </SmoothButton>
    </form>
  );

  if (uncarded) return body;

  return (
    <Card>
      <CardContent className="pt-6">{body}</CardContent>
    </Card>
  );
}

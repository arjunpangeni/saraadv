"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { ServiceContactForm } from "@/components/marketing/service-contact-form";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import {
  SERVICE_INQUIRY_LABELS,
  SERVICE_INQUIRY_TYPES,
  parseServiceInquiryType,
  serviceInquiryCopy,
  type ServiceInquiryTopic,
} from "@/lib/service-inquiries";

export function ContactPageForm() {
  const searchParams = useSearchParams();
  const thanksRef = useRef<HTMLDivElement>(null);
  const [sent, setSent] = useState(false);
  const [topic, setTopic] = useState<ServiceInquiryTopic>(() =>
    parseServiceInquiryType(searchParams.get("topic"))
  );

  const intent = searchParams.get("intent");
  const copy = serviceInquiryCopy(topic, intent);

  useEffect(() => {
    if (!sent) return;
    thanksRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [sent]);

  if (sent) {
    return (
      <div
        ref={thanksRef}
        className="flex flex-col items-center py-8 text-center sm:py-12"
        role="status"
        aria-live="polite"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-brand-sky-muted text-brand-sky">
          <Check className="size-6" aria-hidden />
        </span>
        <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-foreground">
          Thank you
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-foreground/70 sm:text-base">
          Your message was received. The SARA Advisors team will follow up by message or call.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium tracking-tight text-brand-sky">Write to us</p>
        <h2 className="mt-0.5 font-display text-lg font-extrabold tracking-tight text-foreground sm:text-xl">
          Send a message
        </h2>
      </div>
      <div>
        <Label htmlFor="contact-topic">Topic</Label>
        <SelectField
          id="contact-topic"
          className="mt-1.5"
          value={topic}
          onValueChange={(v) => setTopic(parseServiceInquiryType(v))}
          options={SERVICE_INQUIRY_TYPES.map((value) => ({
            value,
            label: SERVICE_INQUIRY_LABELS[value],
          }))}
        />
      </div>
      <ServiceContactForm
        key={`${topic}-${intent ?? "general"}`}
        type={topic}
        title={copy.title}
        subtitle={copy.subtitle}
        placeholder={copy.placeholder}
        defaultSubject={copy.defaultSubject}
        uncarded
        compact
        onSuccess={() => setSent(true)}
      />
    </div>
  );
}

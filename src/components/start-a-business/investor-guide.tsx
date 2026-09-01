"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadGuidePayload, SARA_ADVISOR_MAIL } from "@/lib/start-a-business-guide";

export function InvestorGuide() {
  const [contactName, setContactName] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const guide = loadGuidePayload();
    setContactName(guide?.contactName?.trim() ?? "");
    setReady(true);
  }, []);

  if (!ready) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="card-elevated px-6 py-12 text-center sm:px-10">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-sky-muted text-brand-sky">
        <CheckCircle2 className="h-7 w-7" aria-hidden />
      </div>
      <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-brand-sky uppercase">
        Start a Business
      </p>
      <h1 className="font-display text-3xl font-semibold text-foreground">
        Thank you{contactName ? `, ${contactName}` : ""}
      </h1>
      <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
        We received your inquiry. A SARA Advisors team member will follow up shortly. For more queries,
        contact us at{" "}
        <a href={`mailto:${SARA_ADVISOR_MAIL}`} className="font-medium text-brand-sky underline">
          {SARA_ADVISOR_MAIL}
        </a>
        .
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild variant="sky">
          <a href={`mailto:${SARA_ADVISOR_MAIL}`}>
            <Mail className="h-4 w-4" aria-hidden />
            Email SARA
          </a>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}

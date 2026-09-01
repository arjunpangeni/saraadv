import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactOfficeColumn } from "@/components/marketing/contact-office-panel";
import { ContactPageForm } from "@/components/marketing/contact-page-form";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact SARA Advisors",
  description:
    "Contact SARA Advisors in Kathmandu about company setup, M&A, asset revival, Project Bank, or carbon finance. Confidential intake — no account required.",
  path: "/contact",
  ogTitle: "Contact SARA Advisors | Kathmandu, Nepal",
});

export default function ContactPage() {
  return (
    <main className="flex-1">
      <section className="container-page py-8 sm:py-12 lg:py-14">
        <h1 className="text-pretty font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Contact
        </h1>

        <div className="mt-5 grid overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] lg:mt-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="border-b border-border bg-surface-muted/40 p-4 sm:p-6 lg:border-r lg:border-b-0">
            <ContactOfficeColumn />
          </div>
          <div className="p-4 sm:p-6">
            <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-surface-muted" />}>
              <ContactPageForm />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}

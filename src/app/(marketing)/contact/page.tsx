import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactOfficeColumn } from "@/components/marketing/contact-office-panel";
import { ContactPageForm } from "@/components/marketing/contact-page-form";
import { PageHero } from "@/components/marketing/page-hero";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact ASAR Partners",
  description:
    "Contact ASAR Partners in Kathmandu about company setup, M&A, asset revival, Project Bank, or carbon finance. Confidential intake — no account required.",
  path: "/contact",
  ogTitle: "Contact ASAR Partners | Kathmandu, Nepal",
});

export default function ContactPage() {
  return (
    <main className="flex-1">
      <PageHero
        eyebrow="Contact"
        title="Talk to ASAR Partners"
        description="Company setup, M&A, asset revival, Project Bank, or carbon finance. Confidential intake — no account required."
      />

      <section className="container-page pb-20 sm:pb-28">
        <div className="grid overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="border-b border-border bg-card/50 p-6 sm:p-8 lg:border-r lg:border-b-0">
            <ContactOfficeColumn />
          </div>
          <div className="p-6 sm:p-8">
            <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-surface-muted" />}>
              <ContactPageForm />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}

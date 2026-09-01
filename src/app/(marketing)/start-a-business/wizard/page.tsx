import type { Metadata } from "next";
import { BusinessSetupWizardForm } from "@/components/start-a-business/business-setup-wizard-form";
import { PageHero } from "@/components/marketing/page-hero";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Start a Business inquiry",
  description:
    "Submit your company setup details. SARA Advisors will review your inquiry and contact you — no login required.",
  path: "/start-a-business/wizard",
  ogTitle: "Company setup inquiry | SARA Advisors",
});

export default function StartABusinessWizardPage() {
  return (
    <main className="flex-1">
      <PageHero
        tight
        eyebrow="Start a Business"
        title="Company setup inquiry"
        description="Tell us about the company you want to form — contact details, addresses, investment, shareholders, and sector. We apply Nepal’s current eligibility rules as you go. No login is required. After you submit, our team reviews the inquiry and follows up on the phone and email you provide."
      />
      <div
        id="inquiry-form"
        className="container-page max-w-2xl scroll-mt-28 pt-6 pb-16 sm:pt-8 sm:pb-24"
      >
        <BusinessSetupWizardForm />
      </div>
    </main>
  );
}

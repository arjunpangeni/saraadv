import type { Metadata } from "next";
import { BusinessSetupWizardForm } from "@/components/start-a-business/business-setup-wizard-form";
import { PageHero } from "@/components/marketing/page-hero";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Start a Business inquiry",
  description:
    "Submit your company setup details. ASAR Partners will review your inquiry and contact you — no login required.",
  path: "/start-a-business/wizard",
  ogTitle: "Company setup inquiry | ASAR Partners",
});

export default function StartABusinessWizardPage() {
  return (
    <main className="flex-1">
      <PageHero
        eyebrow="Start a Business"
        title="Company setup inquiry"
        description="Tell us about the company you want to form — contact details, addresses, investment, shareholders, and sector. We apply Nepal’s current eligibility rules as you go. No login is required. After you submit, our team reviews the inquiry and follows up on the phone and email you provide."
        compact
      />
      <div
        id="inquiry-form"
        className="container-page max-w-xl scroll-mt-28 py-8 sm:max-w-2xl sm:py-10 lg:max-w-5xl lg:py-12"
      >
        <BusinessSetupWizardForm />
      </div>
    </main>
  );
}

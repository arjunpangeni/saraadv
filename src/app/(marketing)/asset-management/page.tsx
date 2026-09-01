import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

import { PillarPage } from "@/components/marketing/pillar-page";

export const metadata: Metadata = pageMetadata({
  title: "Asset Revival & Restructuring in Nepal",
  description:
    "Targeted intervention strategies to restructure, revive, and optimize distressed or underperforming assets in Nepal - deep scrutiny, turnaround planning, and continuous review.",
  path: "/asset-management",
  ogTitle: "Asset revival and restructuring in Nepal | SARA Advisors",
});

export default function AssetManagementPage() {
  return (
    <PillarPage
      title="Asset revival and restructuring in Nepal"
      focus="Corporate Revival & Restructuring"
      intro="For distressed assets or businesses performing below their potential, SARA Advisors provides targeted intervention strategies to restructure, revive, and optimize operations - turning underperformance into sustained profitability."
      serviceType="Corporate Revival & Restructuring Advisory"
      cta={{ label: "Contact the SARA team", href: "/contact?topic=ASSET_MANAGEMENT" }}
      showFooterCta={false}
      faq={[
        {
          question: "When does asset revival make sense versus a sale?",
          answer:
            "Revival is for businesses or assets that can return to sustainable profit after leaks, debt, or operations are fixed. If the owners want an exit instead, the M&A desk can run a confidential sale. We diagnose first, then recommend revival, sale, or a sequenced mix.",
        },
        {
          question: "What do you need to start a review?",
          answer:
            "A short brief on the asset, recent financials if you have them, and who the stakeholders are (owners, lenders, management). Use the contact form with the asset-management topic — no account is required. Work stays confidential.",
        },
        {
          question: "Do you take over day-to-day management?",
          answer:
            "We design the turnaround, present it to stakeholders, and monitor execution on an agreed cycle. Operating control stays with the client unless a separate mandate says otherwise.",
        },
      ]}
      sections={[
        {
          heading: "Diagnosis",
          items: [
            "Deep scrutiny - auditing the underperforming asset for operational bottlenecks",
            "Identification of financial leaks and structural inefficiencies",
          ],
        },
        {
          heading: "Revival Strategy",
          items: [
            "Custom turnaround plan - debt restructuring, cost optimization, operational pivoting",
            "Stakeholder presentation - securing buy-in from investors, creditors, management",
          ],
        },
        {
          heading: "Execution & Monitoring",
          items: [
            "Continuous review - periodic monitoring of the revival plan execution",
            "Sustained profitability tracking through structured review cycles",
          ],
        },
      ]}
    />
  );
}

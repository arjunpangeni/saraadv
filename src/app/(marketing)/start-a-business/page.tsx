import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

import { PillarPage } from "@/components/marketing/pillar-page";

export const metadata: Metadata = pageMetadata({
  title: "Start a Business in Nepal - Turnkey Corporate Setup",
  description:
    "End-to-end incubation for domestic enterprises and FDI ventures in Nepal - FDI approval, OCR registration, IRD tax registration, banking, and full regulatory compliance.",
  path: "/start-a-business",
  ogTitle: "Start a business in Nepal | SARA Advisors",
});

export default function StartABusinessPage() {
  return (
    <PillarPage
      title="Start a business in Nepal"
      focus="Turnkey Corporate Setup & Compliance"
      intro="Navigating Nepal's regulatory and operational landscape requires precision and expertise. SARA Advisors provides an end-to-end incubation pipeline for both domestic enterprises and Foreign Direct Investment (FDI) ventures, guiding you from minimal intake details through registration, licensing, and daily operations."
      serviceType="Corporate Formation & Compliance Advisory"
      cta={{ label: "Submit a setup inquiry", href: "/start-a-business/wizard#inquiry-form" }}
      faq={[
        {
          question: "How long does company registration in Nepal take?",
          answer:
            "A straightforward domestic private limited can move through OCR, PAN/VAT, and local licences in a few weeks when documents are complete. FDI adds DOI approval and NRB recording, so the calendar is longer. The intake wizard applies Nepal’s eligibility rules and shows only the steps that apply to you.",
        },
        {
          question: "Do foreign investors need a local partner?",
          answer:
            "Not always. Many sectors allow 100% foreign ownership after Department of Industry approval and NRB recording of the capital. Restricted or licenced sectors still need extra clearances. We screen this at intake rather than assuming a joint venture.",
        },
        {
          question: "Is an account required to start?",
          answer:
            "No. Submit the setup inquiry without logging in. The SARA team reviews it and follows up on the phone and email you provide.",
        },
      ]}
      sections={[
        {
          heading: "Legal & Regulatory Incorporation",
          items: [
            "FDI Approval from the Department of Industry (DOI)",
            "Company Registration (MOA/AOA) at the Office of the Company Registrar (OCR)",
            "Tax Registration (PAN/VAT) with the Inland Revenue Department (IRD)",
            "Local Body Registration - ward and municipal licenses",
            "Regulatory clearances - IEE/EIA screening and sector-specific bodies (DDA, DFTQC, NEA/DOED)",
          ],
        },
        {
          heading: "Post-Registration & Financial Setup",
          items: [
            "Banking & capital - corporate bank accounts, loan/financing",
            "FDI compliance - recording FDI with Nepal Rastra Bank (NRB)",
            "Statutory filings - Share Lagat (Share Register) from OCR",
            "Trade & IP - trademark registration, EXIM Code",
            "Labor compliance - Social Security Fund (SSF) registration",
          ],
        },
        {
          heading: "Operational Infrastructure",
          items: [
            "Office leasing and electricity connection",
            "Corporate website and IRD-approved E-Billing systems",
            "Comprehensive corporate insurance coverage",
          ],
        },
        {
          heading: "Strategic Management & Compliance",
          items: [
            "Governance - policies, SOPs, ISO certification guidance",
            "Financial strategy - business plans and budgeting frameworks",
            "Audit & assurance - internal/external audits, accounting BPO",
            "Cross-sell - Carbon Credit monetization pathways",
          ],
        },
      ]}
    />
  );
}

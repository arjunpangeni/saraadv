import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument, LegalSection } from "@/components/marketing/legal-document";
import { siteConfig } from "@/lib/site-config";
import { pageMetadata, SITE_OFFICE } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description: `How ${siteConfig.name} collects, uses, and protects personal and confidential information on saraadvisors.com.`,
  path: "/privacy",
  ogTitle: "Privacy Policy | SARA Advisors",
});

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      description={`This policy explains what ${siteConfig.name} collects when you use the website, marketplace, Project Bank, and contact forms.`}
      updated="23 August 2026"
      current="privacy"
    >
      <LegalSection title="Who we are">
        <p>
          {siteConfig.name} (“SARA”, “we”) is a corporate and investment advisory firm. This policy
          covers personal information you give us through the site, marketplace, Project Bank, and
          inquiry forms. For privacy questions, email{" "}
          <a href={`mailto:${SITE_OFFICE.email}`} className="font-medium text-brand-sky hover:underline">
            {SITE_OFFICE.email}
          </a>{" "}
          or use the{" "}
          <Link href="/contact" className="font-medium text-brand-sky hover:underline">
            contact form
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Information we collect">
        <p>Depending on how you use the site, we may collect:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Account details — name, email, phone, role (seller, buyer, entrepreneur, investor, advisor).</li>
          <li>
            Inquiries — company-setup intake, carbon and asset-management messages, and other contact-form
            submissions.
          </li>
          <li>
            Marketplace and Project Bank content you submit (teasers, financials, documents) and records of NDA
            access to gated data rooms.
          </li>
          <li>Technical data — IP address, browser, pages viewed, and optional analytics (Google Analytics).</li>
        </ul>
      </LegalSection>

      <LegalSection title="How we use it">
        <p>
          We use this information to respond to inquiries, operate listings and project teasers, run NDA-gated due
          diligence, improve the site, and meet Nepal legal and regulatory duties. We do not sell personal data.
        </p>
      </LegalSection>

      <LegalSection title="Confidential mandates">
        <p>
          M&amp;A listings, Project Bank dossiers, and carbon offtake materials are treated as confidential. Identities
          and data rooms stay gated until an NDA or equivalent access grant. Advisors and counterparties see only what
          their role and signed terms allow.
        </p>
      </LegalSection>

      <LegalSection title="Sharing">
        <p>
          We share data with service providers who host email, storage, authentication, and analytics; with advisors
          working your mandate; and when law requires it. International processors (for example cloud email or
          analytics) may store data outside Nepal under their own terms.
        </p>
      </LegalSection>

      <LegalSection title="Cookies and analytics">
        <p>
          The site may use necessary cookies to keep you signed in and remember preferences. Optional analytics help
          us understand which pages are used. You can refuse non-essential cookies in your browser. Disabling cookies
          may affect sign-in and some forms.
        </p>
      </LegalSection>

      <LegalSection title="Retention and security">
        <p>
          We keep account, inquiry, and mandate records for as long as needed to deliver the service and meet
          record-keeping duties, then delete or anonymize them. We use access controls, HTTPS, and least-privilege
          roles; no method is perfectly secure.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          You may request access, correction, or deletion of personal data we hold, subject to legal holds and
          confidentiality owed to other parties on a live mandate. This site is intended for business users, not
          children.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may update this policy. The date above is the latest version. Continued use of the site after a change
          means you accept the revised policy.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}

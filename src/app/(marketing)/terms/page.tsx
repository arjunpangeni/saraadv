import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument, LegalSection } from "@/components/marketing/legal-document";
import { siteConfig } from "@/lib/site-config";
import { pageMetadata, SITE_OFFICE } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Use",
  description: `Terms for using the ${siteConfig.name} website, marketplace, Project Bank, and advisory intake in Nepal.`,
  path: "/terms",
  ogTitle: "Terms of Use | ASAR Partners",
});

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Use"
      description={`These terms govern access to ${siteConfig.name}’s website, anonymized marketplace, Project Bank, and online intake forms.`}
      updated="23 August 2026"
      current="terms"
    >
      <LegalSection title="Agreement">
        <p>
          By using this site you agree to these terms and our{" "}
          <Link href="/privacy" className="font-semibold text-tz-blue-deep hover:underline">
            Privacy Policy
          </Link>
          . If you do not agree, do not use the site. {siteConfig.name} is based in {SITE_OFFICE.locality},{" "}
          {SITE_OFFICE.region} Province, {SITE_OFFICE.countryName}.
        </p>
      </LegalSection>

      <LegalSection title="Accounts and intake">
        <p>
          You must provide accurate details when you register, list a business, submit a project, or send an inquiry.
          You are responsible for credentials issued to you. We may refuse, suspend, or close accounts that appear
          abusive, fraudulent, or in breach of these terms.
        </p>
      </LegalSection>

      <LegalSection title="Marketplace and Project Bank">
        <p>
          Public listings and project teasers are anonymized. Full financials, identities, and dossiers are available
          only after advisor review and an NDA (or equivalent). ASAR does not guarantee that a listing or project is
          complete, that a deal will close, or that projected returns will be achieved. You must complete your own due
          diligence.
        </p>
      </LegalSection>

      <LegalSection title="Confidentiality">
        <p>
          If you receive gated materials, you will use them only to evaluate the stated opportunity and will not copy,
          scrape, or share them except as the NDA allows. Reverse-engineering or attempting to identify anonymized
          sellers or project owners is prohibited.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>
          You may not use the site to send spam, upload malware, scrape listings, impersonate another person, or
          interfere with other users. Automated access other than ordinary search-engine indexing requires our written
          permission.
        </p>
      </LegalSection>

      <LegalSection title="Intellectual property">
        <p>
          The site design, ASAR marks, and original copy belong to {siteConfig.name} or its licensors. You may not
          reuse them commercially without permission. You keep ownership of materials you upload, and you grant ASAR a
          licence to host and share them as needed to run the relevant mandate.
        </p>
      </LegalSection>

      <LegalSection title="Liability">
        <p>
          To the fullest extent allowed by Nepal law, ASAR is not liable for indirect, incidental, or consequential
          loss arising from use of the site or reliance on teasers and guides. Nothing in these terms limits liability
          that cannot be limited by law (including fraud).
        </p>
      </LegalSection>

      <LegalSection title="Governing law">
        <p>
          These terms are governed by the laws of Nepal. Courts in Kathmandu have jurisdiction, without limiting any
          mandatory consumer protections that apply to you.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may update these terms. The date above is the latest version. Continued use of the site after a change
          means you accept the revised terms. Questions:{" "}
          <a href={`mailto:${SITE_OFFICE.email}`} className="font-semibold text-tz-blue-deep hover:underline">
            {SITE_OFFICE.email}
          </a>
          .
        </p>
      </LegalSection>
    </LegalDocument>
  );
}

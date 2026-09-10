import type { Metadata } from "next";
import { PillarPage } from "@/components/marketing/pillar-page";
import { pageMetadata } from "@/lib/seo";

const TITLE = "Carbon Finance in Nepal";
const DESCRIPTION =
  "ASAR Partners originates, registers, and markets high-integrity carbon projects in Nepal — hydropower, forestry, household energy, and waste — and matches them with corporate buyers, climate funds, and investors seeking verified tonnes and Article 6-ready offtake.";

export const metadata: Metadata = pageMetadata({
  title: "Carbon Finance in Nepal | Credits, Offsets & Climate Investment",
  description: DESCRIPTION,
  path: "/carbon-finance",
  ogTitle: "Carbon Finance in Nepal | ASAR Partners",
  keywords: [
    "carbon finance Nepal",
    "carbon credits Nepal",
    "Gold Standard Nepal",
    "Verified Carbon Standard Nepal",
    "VCS carbon projects",
    "REDD+ Nepal",
    "hydropower carbon credits",
    "improved cookstove carbon",
    "biogas carbon credits Nepal",
    "Article 6 Paris Agreement Nepal",
    "carbon credit investors Nepal",
    "buy carbon offsets Nepal",
    "climate investment Nepal",
    "carbon offtake agreement",
    "MRV carbon Nepal",
  ],
});

const FAQ = [
  {
    question: "What is carbon finance, and how is it different from climate finance?",
    answer:
      "Carbon finance is capital tied to greenhouse-gas outcomes: a verified tonne avoided or removed, a credit, or an offtake on a project that will issue those tonnes. Climate finance is broader and can include adaptation or biodiversity with no carbon metric. ASAR’s desk focuses on the carbon outcome — so buyers, funds, and project owners can transact on the same unit.",
  },
  {
    question: "Can investors buy Nepal carbon credits or finance projects before issuance?",
    answer:
      "Yes. Corporates and funds typically buy issued credits from Gold Standard or Verified Carbon Standard registries, or they pre-finance a pipeline (hydropower, forestry, cookstoves, biogas, waste) against future delivery. ASAR Partners introduces both structures under NDA and does not treat Nepal as a compliance ETS market.",
  },
  {
    question: "How do project owners in Nepal monetise carbon?",
    answer:
      "Through project-based offsetting: prove additionality, register a methodology, complete third-party verification, and sell issued credits or an offtake. Nepal’s practical path today is the voluntary market plus preparation for Article 6 corresponding adjustments with public counterparts — not a domestic emissions-trading scheme.",
  },
];

export default function CarbonFinancePage() {
  return (
    <PillarPage
      title={TITLE}
      focus="Credits, climate investment & Nepal origination"
      intro="Carbon finance is the money that follows a tonne of CO₂-equivalent — credits from real projects, and the capital that builds them. It is a slice of climate finance, not a synonym: the carbon outcome has to be measurable. Globally that sits in two very different markets: project-based offsetting (credits) and compliance carbon pricing (taxes and emissions-trading schemes). Nepal is not an ETS jurisdiction. The opportunity here is high-integrity voluntary credits and Article 6-ready projects — hydropower, community forestry, household energy, and waste — originated for corporate buyers, climate funds, and investors who need documented tonnes, not a slogan. ASAR Partners runs that desk from Kathmandu: feasibility through registration and verification, then confidential matchmaking with offtakers and capital."
      serviceType="Carbon finance, credit origination and climate investment advisory"
      cta={{ label: "Develop a carbon project", href: "/contact?topic=CARBON&intent=project" }}
      secondaryCta={{
        label: "Invest or buy credits",
        href: "/contact?topic=CARBON&intent=investor",
      }}
      showFooterCta={false}
      faq={FAQ}
      sections={[
          {
            heading: "What carbon finance actually is",
            items: [
              "In the narrow sense: resources used to acquire a right over one tonne of CO₂-eq — a credit, an allowance, or a contracted future delivery.",
              "In practice: also the capital that finances the project that creates that tonne, and the brokerage that connects generator and buyer.",
              "Not the same as climate finance. Funding a biodiversity buffer with no emissions impact is climate finance; it is not carbon finance until the GHG outcome is the product.",
              "Two systems that do not overlap: carbon offsetting (project developers issue credits) and carbon pricing (a jurisdiction taxes emissions or runs a cap-and-trade ETS). Nepal’s near-term product is the first; we prepare clients for Article 6 so public counterparties can use the second internationally.",
            ],
          },
          {
            heading: "For project owners and developers",
            items: [
              "Feasibility on additionality, baseline, leakage, and whether a Gold Standard or Verified Carbon Standard (VCS) methodology will hold for your site in Nepal.",
              "Registration, PDD/PD support, and mandatory third-party verification so credits can be issued — not just claimed.",
              "MRV design so monitoring survives audit: hydropower generation, forest carbon, cookstove usage, biogas, methane from waste.",
              "Offtake and spot sale introductions to international corporates, funds, and institutions that buy Nepalese tonnes — the same confidentiality standard as our M&A desk.",
            ],
          },
          {
            heading: "For investors, corporates, and climate funds",
            items: [
              "Origination of Nepal inventory: issued credits and pre-issuance pipelines you can underwrite or offtake.",
              "Integrity screen: methodology, vintage, SDG co-benefits, community rights, double-counting and corresponding-adjustment risk under Article 6.",
              "Structures that fit how carbon actually trades: spot credit purchase, multi-year offtake, or project finance tied to issuance — not a synthetic ‘Nepal ETS’ product.",
              "A single Kathmandu counterparty for site access, local permits, and introductions to developers who will not list publicly.",
            ],
          },
          {
            heading: "Nepal project types we originate",
            items: [
              "Renewable energy and grid hydropower — the country’s deepest historical carbon pipeline.",
              "Community forestry, afforestation, and REDD+-aligned activities where tenure and measurement are bankable.",
              "Household energy: improved cookstoves and biogas — high social co-benefits, established Gold Standard practice in Nepal.",
              "Waste, landfill methane, and agriculture where a recognised methodology exists. Blue carbon (wetlands, where relevant) is assessed case by case.",
            ],
          },
          {
            heading: "Standards, Article 6, and Nepal policy",
            items: [
              "Voluntary market rails first: Verified Carbon Standard and Gold Standard remain how most buyers take delivery today.",
              "Alignment with Nepal’s NDC, Ministry of Forests and Environment practice, and evolving domestic rules so a credit is not stranded by policy.",
              "Article 6 of the Paris Agreement is the inter-governmental market. We document projects so they can support ITMOs and corresponding adjustments when the public counterpart is ready — without promising a timeline the state has not set.",
              "Clear books on who owns the tonne: no double claiming between a corporate offset and a host-country NDC without an agreed adjustment.",
            ],
          },
          {
            heading: "From screening to a signed offtake",
            items: [
              "Screening memo: eligibility, standard, rough volume, and what a buyer or lender will ask next.",
              "Registration and verification pathway with independent auditors.",
              "Buyer or investor process: teaser, NDA, data room, then offtake or investment term sheet.",
              "Contact the desk as a developer (list or build a project) or as a buyer/investor (source tonnes or finance a pipeline). Same form, different intent — the team routes you.",
            ],
          },
        ]}
      />
  );
}

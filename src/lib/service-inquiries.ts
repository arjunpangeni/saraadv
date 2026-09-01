export const SERVICE_INQUIRY_TYPES = [
  "GENERAL",
  "START_A_BUSINESS",
  "BUY_SELL",
  "ASSET_MANAGEMENT",
  "PROJECT_BANK",
  "CARBON",
] as const;

export type ServiceInquiryTopic = (typeof SERVICE_INQUIRY_TYPES)[number];

export const SERVICE_INQUIRY_LABELS: Record<ServiceInquiryTopic, string> = {
  GENERAL: "General inquiry",
  START_A_BUSINESS: "Start a Business",
  BUY_SELL: "Buy / Sell",
  ASSET_MANAGEMENT: "Asset Management",
  PROJECT_BANK: "Project Bank",
  CARBON: "Carbon Finance",
};

export const SERVICE_INQUIRY_TAB_LABELS: Record<ServiceInquiryTopic, string> = {
  GENERAL: "General",
  START_A_BUSINESS: "Setup",
  BUY_SELL: "Buy / Sell",
  ASSET_MANAGEMENT: "Asset",
  PROJECT_BANK: "Projects",
  CARBON: "Carbon",
};

export function isServiceInquiryType(value: string | null | undefined): value is ServiceInquiryTopic {
  return Boolean(value && (SERVICE_INQUIRY_TYPES as readonly string[]).includes(value));
}

export function parseServiceInquiryType(value: string | null | undefined): ServiceInquiryTopic {
  return isServiceInquiryType(value) ? value : "GENERAL";
}

export function serviceInquiryCopy(
  type: ServiceInquiryTopic,
  intent?: string | null
): { title: string; subtitle: string; placeholder: string; defaultSubject?: string } {
  if (type === "CARBON") {
    if (intent === "investor") {
      return {
        title: "Invest or buy Nepal carbon credits",
        subtitle:
          "Tell us the vintage, volume, standards, and sectors you want. The SARA team follows up with pipeline or issued inventory under NDA.",
        placeholder: "e.g. Hydropower VCS offtake / cookstove Gold Standard",
        defaultSubject: "Investor / credit buyer — carbon finance",
      };
    }
    if (intent === "project") {
      return {
        title: "Develop or list a carbon project",
        subtitle:
          "Share the site, technology, and stage (idea, registered, or issued). We assess Gold Standard / VCS eligibility and buyer fit.",
        placeholder: "e.g. Hydropower VCS offtake / cookstove Gold Standard",
        defaultSubject: "Project developer — carbon finance",
      };
    }
    return {
      title: "Carbon finance inquiry",
      subtitle:
        "Tell us whether you generate tonnes, want to buy them, or want to finance a pipeline. The SARA team follows up by message or call.",
      placeholder: "e.g. Hydropower VCS offtake / cookstove Gold Standard",
    };
  }

  const copy: Record<
    Exclude<ServiceInquiryTopic, "CARBON">,
    { title: string; subtitle: string; placeholder: string }
  > = {
    GENERAL: {
      title: "How can we help?",
      subtitle: "Share your situation confidentially. The SARA team follows up by message or call.",
      placeholder: "e.g. Advisory for a Nepal investment",
    },
    START_A_BUSINESS: {
      title: "Company setup inquiry",
      subtitle:
        "Tell us whether this is domestic or FDI, the sector, and where you are in registration. We can also take this through the setup wizard.",
      placeholder: "e.g. FDI company registration in Kathmandu",
    },
    BUY_SELL: {
      title: "M&A / business transfer inquiry",
      subtitle:
        "Buying, selling, or exploring a mandate — describe the sector and confidentiality needs. Marketplace listings stay anonymized until an NDA.",
      placeholder: "e.g. Confidential sale of a manufacturing company",
    },
    ASSET_MANAGEMENT: {
      title: "Asset management inquiry",
      subtitle: "Tell us briefly about your project or situation. The SARA team follows up by message or call.",
      placeholder: "e.g. Restructuring support",
    },
    PROJECT_BANK: {
      title: "Project Bank inquiry",
      subtitle:
        "Raising capital or sourcing a project — share sector, size, and stage. Full dossiers stay gated until vetting and an NDA.",
      placeholder: "e.g. Hydropower project seeking equity",
    },
  };

  return copy[type];
}

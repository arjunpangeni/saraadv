-- Project Bank: Teaser & Gate schema (sectors, CAPEX bands, vault, magic links)

-- New enums
CREATE TYPE "ProjectSector" AS ENUM ('HEALTHCARE', 'HYDROPOWER', 'TOURISM', 'RENEWABLE_ENERGY', 'AGRI_TECH', 'REAL_ESTATE');
CREATE TYPE "CapexRange" AS ENUM ('K50_100', 'K100_250', 'K250_500', 'K500_1M', 'M1_2_5', 'M2_5_5', 'M5_PLUS');
CREATE TYPE "DealDeskStatus" AS ENUM ('NEW', 'UNDER_VETTING', 'NDA_SENT', 'NDA_SIGNED', 'DOSSIER_RELEASED', 'REJECTED');
CREATE TYPE "InvestorType" AS ENUM ('INDIVIDUAL_ANGEL', 'VC_FUND', 'PE_FIRM', 'FAMILY_OFFICE', 'CORPORATE');
CREATE TYPE "InvestmentTimeframe" AS ENUM ('IMMEDIATELY', 'ONE_TO_THREE_MONTHS', 'THREE_TO_SIX_MONTHS', 'EXPLORING');
CREATE TYPE "FundingStage_new" AS ENUM ('PRE_SEED', 'SEED', 'SERIES_A', 'EXPANSION', 'JOINT_VENTURE');
CREATE TYPE "ProjectStatus_new" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED');

-- ProjectListing: add new columns, backfill, drop old
ALTER TABLE "ProjectListing" ADD COLUMN "slug" TEXT;
ALTER TABLE "ProjectListing" ADD COLUMN "sectorNew" "ProjectSector";
ALTER TABLE "ProjectListing" ADD COLUMN "broadRegion" TEXT;
ALTER TABLE "ProjectListing" ADD COLUMN "capexRange" "CapexRange";
ALTER TABLE "ProjectListing" ADD COLUMN "targetRoiIrr" TEXT;
ALTER TABLE "ProjectListing" ADD COLUMN "capitalSought" DECIMAL(18, 2);
ALTER TABLE "ProjectListing" ADD COLUMN "publishedAt" TIMESTAMP(3);
ALTER TABLE "ProjectListing" ADD COLUMN "editedByAdmin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ProjectListing" ADD COLUMN "fundingStageNew" "FundingStage_new";
ALTER TABLE "ProjectListing" ADD COLUMN "statusNew" "ProjectStatus_new";

UPDATE "ProjectListing"
SET
  "slug" = trim(both '-' from lower(regexp_replace(regexp_replace("title", '[^a-zA-Z0-9]+', '-', 'g'), '-+', '-', 'g')))
           || '-' || left("id", 8),
  "sectorNew" = CASE "sector"::text
    WHEN 'HEALTHCARE' THEN 'HEALTHCARE'::"ProjectSector"
    WHEN 'HYDROPOWER' THEN 'HYDROPOWER'::"ProjectSector"
    WHEN 'HOSPITALITY' THEN 'TOURISM'::"ProjectSector"
    WHEN 'AGRICULTURE' THEN 'AGRI_TECH'::"ProjectSector"
    WHEN 'CONSTRUCTION' THEN 'REAL_ESTATE'::"ProjectSector"
    ELSE 'REAL_ESTATE'::"ProjectSector"
  END,
  "broadRegion" = "locationRegion",
  "capexRange" = CASE
    WHEN "capexMaxUsd" < 100000 THEN 'K50_100'::"CapexRange"
    WHEN "capexMaxUsd" < 250000 THEN 'K100_250'::"CapexRange"
    WHEN "capexMaxUsd" < 500000 THEN 'K250_500'::"CapexRange"
    WHEN "capexMaxUsd" < 1000000 THEN 'K500_1M'::"CapexRange"
    WHEN "capexMaxUsd" < 2500000 THEN 'M1_2_5'::"CapexRange"
    WHEN "capexMaxUsd" < 5000000 THEN 'M2_5_5'::"CapexRange"
    ELSE 'M5_PLUS'::"CapexRange"
  END,
  "targetRoiIrr" = trim(to_char("targetRoiMinPct", 'FM999990.##')) || '-' || trim(to_char("targetRoiMaxPct", 'FM999990.##')) || '% Projected IRR',
  "capitalSought" = "capexMaxUsd",
  "publishedAt" = CASE WHEN "status"::text = 'PUBLISHED' THEN "updatedAt" ELSE NULL END,
  "fundingStageNew" = CASE "fundingStage"::text
    WHEN 'PRE_SEED' THEN 'PRE_SEED'::"FundingStage_new"
    WHEN 'SEED' THEN 'SEED'::"FundingStage_new"
    WHEN 'SERIES_A' THEN 'SERIES_A'::"FundingStage_new"
    WHEN 'GROWTH' THEN 'EXPANSION'::"FundingStage_new"
    WHEN 'DEBT' THEN 'EXPANSION'::"FundingStage_new"
    ELSE 'SEED'::"FundingStage_new"
  END,
  "statusNew" = CASE "status"::text
    WHEN 'DRAFT' THEN 'DRAFT'::"ProjectStatus_new"
    WHEN 'PENDING_REVIEW' THEN 'PENDING_REVIEW'::"ProjectStatus_new"
    WHEN 'PUBLISHED' THEN 'PUBLISHED'::"ProjectStatus_new"
    WHEN 'ARCHIVED' THEN 'ARCHIVED'::"ProjectStatus_new"
    ELSE 'DRAFT'::"ProjectStatus_new"
  END;

ALTER TABLE "ProjectListing" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "ProjectListing" ALTER COLUMN "sectorNew" SET NOT NULL;
ALTER TABLE "ProjectListing" ALTER COLUMN "broadRegion" SET NOT NULL;
ALTER TABLE "ProjectListing" ALTER COLUMN "capexRange" SET NOT NULL;
ALTER TABLE "ProjectListing" ALTER COLUMN "targetRoiIrr" SET NOT NULL;
ALTER TABLE "ProjectListing" ALTER COLUMN "capitalSought" SET NOT NULL;
ALTER TABLE "ProjectListing" ALTER COLUMN "fundingStageNew" SET NOT NULL;
ALTER TABLE "ProjectListing" ALTER COLUMN "statusNew" SET NOT NULL;

-- Vault rows while founder contact still lives on the listing
CREATE TABLE "ProjectVault" (
    "projectId" TEXT NOT NULL,
    "exactAddress" TEXT NOT NULL,
    "lat" DECIMAL(10, 7),
    "lng" DECIMAL(10, 7),
    "founderFullName" TEXT NOT NULL,
    "founderEmail" TEXT NOT NULL,
    "founderPhone" TEXT NOT NULL,
    "companyName" TEXT,
    "registrationStatus" TEXT NOT NULL,
    "detailedBreakdown" TEXT NOT NULL,
    "competitiveMoat" TEXT NOT NULL,
    "prototypeUrl" TEXT,
    "financialModelS3Key" TEXT NOT NULL DEFAULT '',
    "bootstrapCapitalInvested" DECIMAL(18, 2) NOT NULL DEFAULT 0,
    "useOfFunds" JSONB NOT NULL,
    "permitsStatus" TEXT NOT NULL,
    "keyRisks" TEXT NOT NULL,
    "fullPitchDeckS3Key" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectVault_pkey" PRIMARY KEY ("projectId")
);

INSERT INTO "ProjectVault" (
  "projectId",
  "exactAddress",
  "founderFullName",
  "founderEmail",
  "founderPhone",
  "registrationStatus",
  "detailedBreakdown",
  "competitiveMoat",
  "useOfFunds",
  "permitsStatus",
  "keyRisks",
  "updatedAt"
)
SELECT
  p."id",
  'To be collected',
  COALESCE(NULLIF(p."contactName", ''), NULLIF(u."name", ''), 'Unknown'),
  u."email",
  COALESCE(NULLIF(p."contactPhone", ''), ''),
  'Unknown',
  'To be collected',
  'To be collected',
  '[]'::jsonb,
  'To be collected',
  'To be collected',
  CURRENT_TIMESTAMP
FROM "ProjectListing" p
JOIN "User" u ON u."id" = p."ownerId";

ALTER TABLE "ProjectVault" ADD CONSTRAINT "ProjectVault_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ProjectListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX IF EXISTS "ProjectListing_sector_status_idx";

ALTER TABLE "ProjectListing" DROP COLUMN "sector";
ALTER TABLE "ProjectListing" DROP COLUMN "locationRegion";
ALTER TABLE "ProjectListing" DROP COLUMN "contactName";
ALTER TABLE "ProjectListing" DROP COLUMN "contactPhone";
ALTER TABLE "ProjectListing" DROP COLUMN "capexMinUsd";
ALTER TABLE "ProjectListing" DROP COLUMN "capexMaxUsd";
ALTER TABLE "ProjectListing" DROP COLUMN "targetRoiMinPct";
ALTER TABLE "ProjectListing" DROP COLUMN "targetRoiMaxPct";
ALTER TABLE "ProjectListing" DROP COLUMN "fundingStage";
ALTER TABLE "ProjectListing" DROP COLUMN "status";

ALTER TABLE "ProjectListing" RENAME COLUMN "sectorNew" TO "sector";
ALTER TABLE "ProjectListing" RENAME COLUMN "fundingStageNew" TO "fundingStage";
ALTER TABLE "ProjectListing" RENAME COLUMN "statusNew" TO "status";

ALTER TABLE "ProjectListing" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

CREATE UNIQUE INDEX "ProjectListing_slug_key" ON "ProjectListing"("slug");
CREATE INDEX "ProjectListing_sector_status_idx" ON "ProjectListing"("sector", "status");
CREATE INDEX "ProjectListing_status_publishedAt_idx" ON "ProjectListing"("status", "publishedAt");

DROP TYPE "FundingStage";
ALTER TYPE "FundingStage_new" RENAME TO "FundingStage";
DROP TYPE "ProjectStatus";
ALTER TYPE "ProjectStatus_new" RENAME TO "ProjectStatus";

-- Leads: new verification + deal-desk fields
ALTER TABLE "ProjectLead" ADD COLUMN "investorType" "InvestorType" NOT NULL DEFAULT 'INDIVIDUAL_ANGEL';
ALTER TABLE "ProjectLead" ADD COLUMN "investmentTimeframe" "InvestmentTimeframe" NOT NULL DEFAULT 'EXPLORING';
ALTER TABLE "ProjectLead" ADD COLUMN "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ProjectLead" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "ProjectLead" ADD COLUMN "adminNotes" TEXT;
ALTER TABLE "ProjectLead" ADD COLUMN "statusNew" "DealDeskStatus";

UPDATE "ProjectLead"
SET
  "isEmailVerified" = true,
  "emailVerifiedAt" = "createdAt",
  "statusNew" = CASE "status"::text
    WHEN 'NEW' THEN 'NEW'::"DealDeskStatus"
    WHEN 'VETTED' THEN 'UNDER_VETTING'::"DealDeskStatus"
    WHEN 'NDA_SIGNED' THEN 'NDA_SIGNED'::"DealDeskStatus"
    WHEN 'IN_DISCUSSION' THEN 'DOSSIER_RELEASED'::"DealDeskStatus"
    WHEN 'CLOSED' THEN 'DOSSIER_RELEASED'::"DealDeskStatus"
    ELSE 'NEW'::"DealDeskStatus"
  END;

ALTER TABLE "ProjectLead" ALTER COLUMN "statusNew" SET NOT NULL;
ALTER TABLE "ProjectLead" DROP COLUMN "status";
ALTER TABLE "ProjectLead" RENAME COLUMN "statusNew" TO "status";
ALTER TABLE "ProjectLead" ALTER COLUMN "status" SET DEFAULT 'NEW';

DROP TYPE "LeadStatus";

CREATE INDEX "ProjectLead_isEmailVerified_status_idx" ON "ProjectLead"("isEmailVerified", "status");

CREATE TABLE "ProjectLeadMagicLink" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectLeadMagicLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectLeadMagicLink_tokenHash_key" ON "ProjectLeadMagicLink"("tokenHash");
CREATE INDEX "ProjectLeadMagicLink_leadId_createdAt_idx" ON "ProjectLeadMagicLink"("leadId", "createdAt");

ALTER TABLE "ProjectLeadMagicLink" ADD CONSTRAINT "ProjectLeadMagicLink_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "ProjectLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

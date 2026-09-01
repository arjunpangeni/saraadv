-- Buy/Sell line-item financial matrices, operating provinces, compliance remarks,
-- licensed capacity unit, and unique Project Bank leads.

DO $$ BEGIN
  CREATE TYPE "FinancialKind" AS ENUM ('HISTORICAL', 'FORECAST');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "FinancialsKind" AS ENUM ('HISTORICAL', 'FORECAST');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "FinancialsKind" ADD VALUE IF NOT EXISTS 'FORECAST';
ALTER TYPE "FinancialKind" ADD VALUE IF NOT EXISTS 'FORECAST';

ALTER TYPE "ComplianceAuthority" ADD VALUE IF NOT EXISTS 'SPECIALIZED_PERMITS';
ALTER TYPE "ComplianceAuthority" ADD VALUE IF NOT EXISTS 'IP_BLOCKS';

ALTER TABLE "Listing"
  ADD COLUMN IF NOT EXISTS "operatingProvinces" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "strategicAssumptions" TEXT;

UPDATE "Listing"
SET "operatingProvinces" = ARRAY[TRIM("headOffice"->>'province')]::TEXT[]
WHERE COALESCE(TRIM("headOffice"->>'province'), '') <> ''
  AND (COALESCE(array_length("operatingProvinces", 1), 0) = 0);

ALTER TABLE "FinancialsAnnual"
  ADD COLUMN IF NOT EXISTS "kind" "FinancialKind" NOT NULL DEFAULT 'HISTORICAL',
  ADD COLUMN IF NOT EXISTS "fiscalYearLabel" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "ppe" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "ncaOthers" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "inventory" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "receivables" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "cashAndBank" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "caOthers" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "shareCapital" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "reserves" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "equityOthers" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "longTermLoan" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "nclOthers" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "shortTermLoans" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "payables" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "clOthers" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "grossRevenue" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "costOfRevenue" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "otherIncome" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "adminExpenses" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "financeCost" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "taxExpenses" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "ncaTotal" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "caTotal" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "totalAssets" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "equityTotal" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "nclTotal" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "clTotal" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "totalEquityLiabilities" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "pbt" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "cfTotal" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "revenueGrowthPct" DECIMAL(6, 2),
  ADD COLUMN IF NOT EXISTS "netMarginPct" DECIMAL(6, 2),
  ADD COLUMN IF NOT EXISTS "capex" DECIMAL(18, 2);

-- If `kind` already existed as FinancialsKind, convert it to FinancialKind.
ALTER TABLE "FinancialsAnnual" ALTER COLUMN "kind" DROP DEFAULT;
ALTER TABLE "FinancialsAnnual"
  ALTER COLUMN "kind" TYPE "FinancialKind"
  USING "kind"::text::"FinancialKind";
ALTER TABLE "FinancialsAnnual"
  ALTER COLUMN "kind" SET DEFAULT 'HISTORICAL'::"FinancialKind";

UPDATE "FinancialsAnnual" SET
  "ppe" = COALESCE("nonCurrentAssets", 0),
  "caOthers" = COALESCE("currentAssets", 0),
  "reserves" = COALESCE("equityReserves", 0),
  "nclOthers" = COALESCE("nonCurrentLiabilities", 0),
  "clOthers" = COALESCE("currentLiabilities", 0),
  "grossRevenue" = COALESCE("revenue", 0),
  "costOfRevenue" = COALESCE("cogs", 0),
  "adminExpenses" = COALESCE("opex", 0),
  "financeCost" = COALESCE("interestExpense", 0),
  "taxExpenses" = COALESCE("taxPaid", 0),
  "ncaTotal" = COALESCE("nonCurrentAssets", 0),
  "caTotal" = COALESCE("currentAssets", 0),
  "totalAssets" = COALESCE("nonCurrentAssets", 0) + COALESCE("currentAssets", 0),
  "equityTotal" = COALESCE("equityReserves", 0),
  "nclTotal" = COALESCE("nonCurrentLiabilities", 0),
  "clTotal" = COALESCE("currentLiabilities", 0),
  "totalEquityLiabilities" = COALESCE("equityReserves", 0) + COALESCE("nonCurrentLiabilities", 0) + COALESCE("currentLiabilities", 0),
  "pbt" = COALESCE("ebitda", 0) - COALESCE("depreciation", 0) - COALESCE("interestExpense", 0),
  "cfTotal" = COALESCE("cfo", 0) + COALESCE("cfi", 0) + COALESCE("cff", 0),
  "fiscalYearLabel" = CASE "fiscalYear"
    WHEN 1 THEN '2025-26'
    WHEN 2 THEN '2024-25'
    WHEN 3 THEN '2023-24'
    ELSE '2025-26'
  END
WHERE "kind"::text = 'HISTORICAL';

INSERT INTO "FinancialsAnnual" (
  "id", "listingId", "kind", "fiscalYear", "fiscalYearLabel",
  "ppe", "ncaOthers", "inventory", "receivables", "cashAndBank", "caOthers",
  "shareCapital", "reserves", "equityOthers", "longTermLoan", "nclOthers",
  "shortTermLoans", "payables", "clOthers",
  "grossRevenue", "costOfRevenue", "otherIncome", "adminExpenses", "financeCost",
  "depreciation", "taxExpenses", "cfo", "cfi", "cff",
  "ncaTotal", "caTotal", "totalAssets", "equityTotal", "nclTotal", "clTotal",
  "totalEquityLiabilities", "grossProfit", "ebitda", "pbt", "npat", "cfTotal",
  "revenueGrowthPct", "netMarginPct", "capex"
)
SELECT
  concat('fc_', "id"),
  "listingId",
  'FORECAST'::"FinancialKind",
  "year",
  CASE "year"
    WHEN 1 THEN '2026-27'
    WHEN 2 THEN '2027-28'
    WHEN 3 THEN '2028-29'
    ELSE '2026-27'
  END,
  0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0,
  0, 0, 0,
  0, 0, 0, 0, 0,
  0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0,
  "revenueGrowthPct",
  "netMarginPct",
  "capex"
FROM "Projection" p
WHERE NOT EXISTS (
  SELECT 1 FROM "FinancialsAnnual" f
  WHERE f."listingId" = p."listingId" AND f."kind"::text = 'FORECAST' AND f."fiscalYear" = p."year"
);

UPDATE "Listing" l
SET "strategicAssumptions" = sub.assumptions
FROM (
  SELECT DISTINCT ON ("listingId") "listingId", "assumptions"
  FROM "Projection"
  WHERE COALESCE("assumptions", '') <> ''
  ORDER BY "listingId", "year"
) sub
WHERE l."id" = sub."listingId"
  AND COALESCE(l."strategicAssumptions", '') = '';

ALTER TABLE "FinancialsAnnual" DROP CONSTRAINT IF EXISTS "FinancialsAnnual_listingId_fiscalYear_key";
DROP INDEX IF EXISTS "FinancialsAnnual_listingId_fiscalYear_key";

CREATE UNIQUE INDEX IF NOT EXISTS "FinancialsAnnual_listingId_kind_fiscalYear_key"
  ON "FinancialsAnnual"("listingId", "kind", "fiscalYear");

ALTER TABLE "FinancialsAnnual"
  DROP COLUMN IF EXISTS "nonCurrentAssets",
  DROP COLUMN IF EXISTS "currentAssets",
  DROP COLUMN IF EXISTS "equityReserves",
  DROP COLUMN IF EXISTS "nonCurrentLiabilities",
  DROP COLUMN IF EXISTS "currentLiabilities",
  DROP COLUMN IF EXISTS "revenue",
  DROP COLUMN IF EXISTS "cogs",
  DROP COLUMN IF EXISTS "opex",
  DROP COLUMN IF EXISTS "interestExpense",
  DROP COLUMN IF EXISTS "taxPaid";

ALTER TABLE "ComplianceRecord" ADD COLUMN IF NOT EXISTS "remarks" TEXT;
UPDATE "ComplianceRecord"
SET "remarks" = "outstandingDisputes"
WHERE COALESCE("remarks", '') = '' AND COALESCE("outstandingDisputes", '') <> '';

ALTER TABLE "CapacityMetric" ADD COLUMN IF NOT EXISTS "capacityUnit" TEXT NOT NULL DEFAULT '';

UPDATE "ProjectLead" SET "email" = lower("email") WHERE "email" <> lower("email");

DELETE FROM "ProjectLead" a
USING "ProjectLead" b
WHERE a."projectId" = b."projectId"
  AND lower(a."email") = lower(b."email")
  AND a."createdAt" < b."createdAt";

CREATE UNIQUE INDEX IF NOT EXISTS "ProjectLead_projectId_email_key"
  ON "ProjectLead"("projectId", "email");

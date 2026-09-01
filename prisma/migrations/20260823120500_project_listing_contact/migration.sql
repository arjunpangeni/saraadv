-- Entrepreneur contact details for the deal desk (not shown on public teasers).

ALTER TABLE "ProjectListing" ADD COLUMN IF NOT EXISTS "contactName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ProjectListing" ADD COLUMN IF NOT EXISTS "contactPhone" TEXT NOT NULL DEFAULT '';

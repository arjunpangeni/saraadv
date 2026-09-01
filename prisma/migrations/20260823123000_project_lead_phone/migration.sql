-- Investor phone on dossier requests so the deal desk can call back.

ALTER TABLE "ProjectLead" ADD COLUMN IF NOT EXISTS "phone" TEXT NOT NULL DEFAULT '';

-- Project Bank simplification: vetting, NDA, and dossier delivery move offline.
DROP TABLE IF EXISTS "ProjectNdaAgreement";

ALTER TABLE "ProjectListing" DROP COLUMN IF EXISTS "dossierS3Key";

ALTER TABLE "ProjectLead" DROP COLUMN IF EXISTS "accessToken";

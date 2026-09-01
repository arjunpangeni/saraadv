/*
  Warnings:

  - A unique constraint covering the columns `[accessToken]` on the table `ProjectLead` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contactName` to the `BusinessSetup` table without a default value. This is not possible if the table is not empty.
  - The required column `accessToken` was added to the `ProjectLead` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "ServiceInquiryType" AS ENUM ('CARBON', 'ASSET_MANAGEMENT');

-- CreateEnum
CREATE TYPE "ServiceInquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED');

-- AlterEnum
ALTER TYPE "ProjectStatus" ADD VALUE 'PENDING_REVIEW';

-- AlterEnum
ALTER TYPE "SetupStatus" ADD VALUE 'CONTACTED';

-- DropForeignKey
ALTER TABLE "BusinessSetup" DROP CONSTRAINT "BusinessSetup_ownerId_fkey";

-- AlterTable
ALTER TABLE "BusinessSetup" ADD COLUMN     "assignedAdvisorId" TEXT,
ADD COLUMN     "contactName" TEXT NOT NULL,
ADD COLUMN     "sectorTags" JSONB NOT NULL DEFAULT '[]',
ALTER COLUMN "ownerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ComplianceTask" ADD COLUMN     "serviceRequestedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CrmTicket" ADD COLUMN     "businessSetupId" TEXT;

-- AlterTable
ALTER TABLE "ProjectLead" ADD COLUMN     "accessToken" TEXT NOT NULL,
ADD COLUMN     "buyerId" TEXT;

-- AlterTable
ALTER TABLE "ProjectListing" ADD COLUMN     "dossierS3Key" TEXT,
ADD COLUMN     "reviewNotes" TEXT;

-- CreateTable
CREATE TABLE "ProjectNdaAgreement" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "projectLeadId" TEXT NOT NULL,
    "buyerId" TEXT,
    "email" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "documentS3Key" TEXT,

    CONSTRAINT "ProjectNdaAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceInquiry" (
    "id" TEXT NOT NULL,
    "type" "ServiceInquiryType" NOT NULL,
    "contactName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "status" "ServiceInquiryStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectNdaAgreement_projectLeadId_key" ON "ProjectNdaAgreement"("projectLeadId");

-- CreateIndex
CREATE INDEX "ProjectNdaAgreement_projectId_idx" ON "ProjectNdaAgreement"("projectId");

-- CreateIndex
CREATE INDEX "ProjectNdaAgreement_email_idx" ON "ProjectNdaAgreement"("email");

-- CreateIndex
CREATE INDEX "ServiceInquiry_type_status_createdAt_idx" ON "ServiceInquiry"("type", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ServiceInquiry_email_idx" ON "ServiceInquiry"("email");

-- CreateIndex
CREATE INDEX "BusinessSetup_status_createdAt_idx" ON "BusinessSetup"("status", "createdAt");

-- CreateIndex
CREATE INDEX "BusinessSetup_email_idx" ON "BusinessSetup"("email");

-- CreateIndex
CREATE INDEX "CrmTicket_businessSetupId_idx" ON "CrmTicket"("businessSetupId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectLead_accessToken_key" ON "ProjectLead"("accessToken");

-- AddForeignKey
ALTER TABLE "CrmTicket" ADD CONSTRAINT "CrmTicket_businessSetupId_fkey" FOREIGN KEY ("businessSetupId") REFERENCES "BusinessSetup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessSetup" ADD CONSTRAINT "BusinessSetup_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessSetup" ADD CONSTRAINT "BusinessSetup_assignedAdvisorId_fkey" FOREIGN KEY ("assignedAdvisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectLead" ADD CONSTRAINT "ProjectLead_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectNdaAgreement" ADD CONSTRAINT "ProjectNdaAgreement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ProjectListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectNdaAgreement" ADD CONSTRAINT "ProjectNdaAgreement_projectLeadId_fkey" FOREIGN KEY ("projectLeadId") REFERENCES "ProjectLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectNdaAgreement" ADD CONSTRAINT "ProjectNdaAgreement_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ADVISOR', 'SELLER', 'BUYER', 'ENTREPRENEUR', 'INVESTOR');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'NDA_LOCKED', 'UNDER_LOI', 'CLOSED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "IndustrySector" AS ENUM ('HYDROPOWER', 'MANUFACTURING', 'FMCG', 'IT', 'HOSPITALITY', 'RETAIL', 'HEALTHCARE', 'CONSTRUCTION', 'TELECOM', 'AGRICULTURE', 'OTHER');

-- CreateEnum
CREATE TYPE "LegalStructure" AS ENUM ('PRIVATE_LIMITED', 'PUBLIC_LIMITED', 'PARTNERSHIP', 'PROPRIETORSHIP');

-- CreateEnum
CREATE TYPE "TransactionModality" AS ENUM ('OUTRIGHT_ACQUISITION', 'MAJORITY_EQUITY_TRANSFER', 'STRATEGIC_JOINT_VENTURE', 'ASSET_BLOCK_PURCHASE');

-- CreateEnum
CREATE TYPE "ExitReason" AS ENUM ('EXECUTIVE_RETIREMENT', 'CORPORATE_RELOCATION', 'PARTNER_REALIGNMENT', 'LIQUID_CAPITAL_REQUIREMENTS', 'OTHER');

-- CreateEnum
CREATE TYPE "RevaluationAssetType" AS ENUM ('LAND_BUILDINGS', 'PLANT_MACHINERY', 'INVENTORY', 'INTANGIBLES');

-- CreateEnum
CREATE TYPE "ComplianceAuthority" AS ENUM ('OCR', 'IRD', 'DOI', 'DDA', 'DFTQC', 'NEA_DOED', 'NRB', 'SEBON', 'SSF', 'OTHER');

-- CreateEnum
CREATE TYPE "IpAssetType" AS ENUM ('TRADEMARK', 'PATENT', 'COPYRIGHT');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('MOA_AOA', 'PITCH_DECK', 'FINANCIAL_STATEMENT', 'REGULATORY_ATTACHMENT', 'TEASER', 'NDA', 'OTHER');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'IN_PROGRESS', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "BusinessObjective" AS ENUM ('MANUFACTURING', 'TRADING', 'SERVICE');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('PRIVATE_LIMITED', 'PUBLIC_LIMITED', 'PROPRIETORSHIP', 'PARTNERSHIP');

-- CreateEnum
CREATE TYPE "SetupStatus" AS ENUM ('INTAKE', 'RULES_GENERATED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AddressKind" AS ENUM ('HEAD_OFFICE', 'BRANCH', 'FACTORY', 'GODOWN', 'STORE');

-- CreateEnum
CREATE TYPE "ShareholderCategory" AS ENUM ('NEPALI_CITIZEN', 'FOREIGN_CITIZEN', 'NEPALI_ENTITY', 'FOREIGN_ENTITY', 'PUBLIC');

-- CreateEnum
CREATE TYPE "IndustrySizeCategory" AS ENUM ('MICRO', 'COTTAGE', 'SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "IndustryObjectiveCategory" AS ENUM ('ENERGY', 'MANUFACTURING', 'AGRICULTURE_FOREST', 'MINERAL', 'INFRASTRUCTURE', 'TOURISM', 'ICT', 'SERVICE', 'TRADING');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "ScreeningLevel" AS ENUM ('BRIEF', 'IEE', 'EIA');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('DIAGNOSIS', 'STRATEGY', 'STAKEHOLDER_REVIEW', 'EXECUTION', 'MONITORING', 'CLOSED');

-- CreateEnum
CREATE TYPE "FundingStage" AS ENUM ('PRE_SEED', 'SEED', 'SERIES_A', 'GROWTH', 'DEBT');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'VETTED', 'NDA_SIGNED', 'IN_DISCUSSION', 'CLOSED');

-- CreateEnum
CREATE TYPE "CarbonProjectType" AS ENUM ('RENEWABLE_ENERGY', 'FORESTRY', 'AGRICULTURE', 'WASTE_MANAGEMENT');

-- CreateEnum
CREATE TYPE "CarbonStandard" AS ENUM ('VERIFIED_CARBON_STANDARD', 'GOLD_STANDARD');

-- CreateEnum
CREATE TYPE "CarbonStatus" AS ENUM ('FEASIBILITY', 'REGISTRATION', 'VERIFICATION', 'ISSUED', 'TRADING');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'BUYER',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kycStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "path" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "hashId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "organizationId" TEXT,
    "industry" "IndustrySector" NOT NULL,
    "legalStructure" "LegalStructure" NOT NULL,
    "establishedYear" INTEGER NOT NULL,
    "headOffice" JSONB NOT NULL,
    "plantLocation" JSONB,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialsAnnual" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "nonCurrentAssets" DECIMAL(18,2) NOT NULL,
    "currentAssets" DECIMAL(18,2) NOT NULL,
    "equityReserves" DECIMAL(18,2) NOT NULL,
    "nonCurrentLiabilities" DECIMAL(18,2) NOT NULL,
    "currentLiabilities" DECIMAL(18,2) NOT NULL,
    "revenue" DECIMAL(18,2) NOT NULL,
    "cogs" DECIMAL(18,2) NOT NULL,
    "opex" DECIMAL(18,2) NOT NULL,
    "depreciation" DECIMAL(18,2) NOT NULL,
    "interestExpense" DECIMAL(18,2) NOT NULL,
    "taxPaid" DECIMAL(18,2) NOT NULL,
    "grossProfit" DECIMAL(18,2) NOT NULL,
    "ebitda" DECIMAL(18,2) NOT NULL,
    "npat" DECIMAL(18,2) NOT NULL,
    "cfo" DECIMAL(18,2) NOT NULL,
    "cfi" DECIMAL(18,2) NOT NULL,
    "cff" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "FinancialsAnnual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Projection" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "revenueGrowthPct" DECIMAL(6,2) NOT NULL,
    "netMarginPct" DECIMAL(6,2) NOT NULL,
    "capex" DECIMAL(18,2) NOT NULL,
    "assumptions" TEXT,

    CONSTRAINT "Projection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetRevaluation" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "assetType" "RevaluationAssetType" NOT NULL,
    "bookValue" DECIMAL(18,2) NOT NULL,
    "marketValue" DECIMAL(18,2) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "AssetRevaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceRecord" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "authority" "ComplianceAuthority" NOT NULL,
    "status" TEXT NOT NULL,
    "identifier" TEXT,
    "lastClearanceYear" INTEGER,
    "outstandingDisputes" TEXT,

    CONSTRAINT "ComplianceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IpAsset" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "type" "IpAssetType" NOT NULL,
    "reference" TEXT NOT NULL,

    CONSTRAINT "IpAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealTerms" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "askingPriceNpr" DECIMAL(18,2) NOT NULL,
    "modality" "TransactionModality" NOT NULL,
    "exitReason" "ExitReason" NOT NULL,
    "valuationJustification" TEXT NOT NULL,

    CONSTRAINT "DealTerms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HumanCapital" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "managementCount" INTEGER NOT NULL,
    "technicalCount" INTEGER NOT NULL,
    "generalCount" INTEGER NOT NULL,
    "ssfCompliant" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "HumanCapital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskLog" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "outstandingDebt" DECIMAL(18,2) NOT NULL,
    "assetEncumbrances" TEXT,
    "bankCollateralTies" TEXT,
    "pendingLitigations" TEXT,

    CONSTRAINT "RiskLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapacityMetric" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "runningOutput" DECIMAL(18,2) NOT NULL,
    "installedPeak" DECIMAL(18,2) NOT NULL,
    "utilizationPct" DECIMAL(6,2) NOT NULL,

    CONSTRAINT "CapacityMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "s3Key" TEXT NOT NULL,
    "isIdentifying" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teaser" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Teaser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NdaAgreement" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "documentS3Key" TEXT,

    CONSTRAINT "NdaAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnlockRequest" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "servicesSelected" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnlockRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmTicket" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "listingId" TEXT,
    "projectId" TEXT,
    "source" TEXT NOT NULL,
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TicketStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingEmbedding" (
    "listingId" TEXT NOT NULL,
    "embedding" vector(1536),
    "content" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingEmbedding_pkey" PRIMARY KEY ("listingId")
);

-- CreateTable
CREATE TABLE "BusinessSetup" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "objective" "BusinessObjective" NOT NULL,
    "businessType" "BusinessType" NOT NULL,
    "fdiRequested" BOOLEAN NOT NULL DEFAULT false,
    "status" "SetupStatus" NOT NULL DEFAULT 'INTAKE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessSetup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SetupAddress" (
    "id" TEXT NOT NULL,
    "setupId" TEXT NOT NULL,
    "kind" "AddressKind" NOT NULL,
    "district" TEXT NOT NULL,
    "localBody" TEXT NOT NULL,

    CONSTRAINT "SetupAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SetupInvestment" (
    "id" TEXT NOT NULL,
    "setupId" TEXT NOT NULL,
    "equityInvestment" DECIMAL(18,2) NOT NULL,
    "loanInvestment" DECIMAL(18,2) NOT NULL,
    "fixedAssets" DECIMAL(18,2) NOT NULL,
    "plantMachineryCost" DECIMAL(18,2) NOT NULL,
    "netCurrentAssets" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "SetupInvestment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shareholder" (
    "id" TEXT NOT NULL,
    "setupId" TEXT NOT NULL,
    "category" "ShareholderCategory" NOT NULL,
    "promoterCount" INTEGER NOT NULL,
    "committedCapital" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "Shareholder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndustryClassification" (
    "id" TEXT NOT NULL,
    "setupId" TEXT NOT NULL,
    "sizeCategory" "IndustrySizeCategory" NOT NULL,
    "objectiveCategory" "IndustryObjectiveCategory" NOT NULL,
    "licenseRequired" BOOLEAN NOT NULL DEFAULT false,
    "ieeEiaLevel" TEXT,

    CONSTRAINT "IndustryClassification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceTask" (
    "id" TEXT NOT NULL,
    "setupId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authority" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulatoryRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authority" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "appliesWhen" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RegulatoryRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IeeEiaCriterion" (
    "id" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "level" "ScreeningLevel" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "IeeEiaCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FdiNegativeListItem" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "FdiNegativeListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestructuringCase" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "assetName" TEXT NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'DIAGNOSIS',
    "diagnosisText" TEXT,
    "turnaroundPlan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestructuringCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewCycle" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectListing" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sector" "IndustrySector" NOT NULL,
    "locationRegion" TEXT NOT NULL,
    "elevatorPitch" TEXT NOT NULL,
    "capexMinUsd" DECIMAL(18,2) NOT NULL,
    "capexMaxUsd" DECIMAL(18,2) NOT NULL,
    "targetRoiMinPct" DECIMAL(6,2) NOT NULL,
    "targetRoiMaxPct" DECIMAL(6,2) NOT NULL,
    "fundingStage" "FundingStage" NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectVisualAsset" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "caption" TEXT,

    CONSTRAINT "ProjectVisualAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectLead" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "firm" TEXT,
    "email" TEXT NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "ndaSignedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectEmbedding" (
    "projectId" TEXT NOT NULL,
    "embedding" vector(1536),
    "content" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectEmbedding_pkey" PRIMARY KEY ("projectId")
);

-- CreateTable
CREATE TABLE "CarbonProject" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CarbonProjectType" NOT NULL,
    "standard" "CarbonStandard",
    "status" "CarbonStatus" NOT NULL DEFAULT 'FEASIBILITY',
    "estimatedCredits" DECIMAL(18,2),
    "verificationStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarbonProject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Organization_ownerId_idx" ON "Organization"("ownerId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Event_type_createdAt_idx" ON "Event"("type", "createdAt");

-- CreateIndex
CREATE INDEX "Event_entityType_entityId_idx" ON "Event"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_hashId_key" ON "Listing"("hashId");

-- CreateIndex
CREATE INDEX "Listing_industry_status_idx" ON "Listing"("industry", "status");

-- CreateIndex
CREATE INDEX "Listing_ownerId_idx" ON "Listing"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialsAnnual_listingId_fiscalYear_key" ON "FinancialsAnnual"("listingId", "fiscalYear");

-- CreateIndex
CREATE UNIQUE INDEX "Projection_listingId_year_key" ON "Projection"("listingId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "DealTerms_listingId_key" ON "DealTerms"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "HumanCapital_listingId_key" ON "HumanCapital"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskLog_listingId_key" ON "RiskLog"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "CapacityMetric_listingId_key" ON "CapacityMetric"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "NdaAgreement_buyerId_listingId_key" ON "NdaAgreement"("buyerId", "listingId");

-- CreateIndex
CREATE INDEX "CrmTicket_status_priority_idx" ON "CrmTicket"("status", "priority");

-- CreateIndex
CREATE INDEX "BusinessSetup_ownerId_idx" ON "BusinessSetup"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "SetupInvestment_setupId_key" ON "SetupInvestment"("setupId");

-- CreateIndex
CREATE UNIQUE INDEX "IndustryClassification_setupId_key" ON "IndustryClassification"("setupId");

-- CreateIndex
CREATE INDEX "ComplianceTask_setupId_status_idx" ON "ComplianceTask"("setupId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RegulatoryRule_code_key" ON "RegulatoryRule"("code");

-- CreateIndex
CREATE INDEX "IeeEiaCriterion_sector_idx" ON "IeeEiaCriterion"("sector");

-- CreateIndex
CREATE UNIQUE INDEX "FdiNegativeListItem_code_key" ON "FdiNegativeListItem"("code");

-- CreateIndex
CREATE INDEX "RestructuringCase_clientId_idx" ON "RestructuringCase"("clientId");

-- CreateIndex
CREATE INDEX "ProjectListing_sector_status_idx" ON "ProjectListing"("sector", "status");

-- CreateIndex
CREATE INDEX "CarbonProject_ownerId_status_idx" ON "CarbonProject"("ownerId", "status");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialsAnnual" ADD CONSTRAINT "FinancialsAnnual_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Projection" ADD CONSTRAINT "Projection_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetRevaluation" ADD CONSTRAINT "AssetRevaluation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceRecord" ADD CONSTRAINT "ComplianceRecord_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IpAsset" ADD CONSTRAINT "IpAsset_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealTerms" ADD CONSTRAINT "DealTerms_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HumanCapital" ADD CONSTRAINT "HumanCapital_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskLog" ADD CONSTRAINT "RiskLog_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapacityMetric" ADD CONSTRAINT "CapacityMetric_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teaser" ADD CONSTRAINT "Teaser_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NdaAgreement" ADD CONSTRAINT "NdaAgreement_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NdaAgreement" ADD CONSTRAINT "NdaAgreement_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnlockRequest" ADD CONSTRAINT "UnlockRequest_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnlockRequest" ADD CONSTRAINT "UnlockRequest_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmTicket" ADD CONSTRAINT "CrmTicket_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmTicket" ADD CONSTRAINT "CrmTicket_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmTicket" ADD CONSTRAINT "CrmTicket_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ProjectListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingEmbedding" ADD CONSTRAINT "ListingEmbedding_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessSetup" ADD CONSTRAINT "BusinessSetup_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetupAddress" ADD CONSTRAINT "SetupAddress_setupId_fkey" FOREIGN KEY ("setupId") REFERENCES "BusinessSetup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetupInvestment" ADD CONSTRAINT "SetupInvestment_setupId_fkey" FOREIGN KEY ("setupId") REFERENCES "BusinessSetup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shareholder" ADD CONSTRAINT "Shareholder_setupId_fkey" FOREIGN KEY ("setupId") REFERENCES "BusinessSetup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndustryClassification" ADD CONSTRAINT "IndustryClassification_setupId_fkey" FOREIGN KEY ("setupId") REFERENCES "BusinessSetup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceTask" ADD CONSTRAINT "ComplianceTask_setupId_fkey" FOREIGN KEY ("setupId") REFERENCES "BusinessSetup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestructuringCase" ADD CONSTRAINT "RestructuringCase_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewCycle" ADD CONSTRAINT "ReviewCycle_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "RestructuringCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectListing" ADD CONSTRAINT "ProjectListing_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectVisualAsset" ADD CONSTRAINT "ProjectVisualAsset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ProjectListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectLead" ADD CONSTRAINT "ProjectLead_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ProjectListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectEmbedding" ADD CONSTRAINT "ProjectEmbedding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ProjectListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarbonProject" ADD CONSTRAINT "CarbonProject_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ListingLead" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT,
    "name" TEXT NOT NULL,
    "firm" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "investorType" "InvestorType" NOT NULL DEFAULT 'INDIVIDUAL_ANGEL',
    "investmentTimeframe" "InvestmentTimeframe" NOT NULL DEFAULT 'EXPLORING',
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "status" "DealDeskStatus" NOT NULL DEFAULT 'NEW',
    "ndaSignedAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingLeadMagicLink" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingLeadMagicLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ListingLead_isEmailVerified_status_idx" ON "ListingLead"("isEmailVerified", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ListingLead_listingId_email_key" ON "ListingLead"("listingId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "ListingLeadMagicLink_tokenHash_key" ON "ListingLeadMagicLink"("tokenHash");

-- CreateIndex
CREATE INDEX "ListingLeadMagicLink_leadId_createdAt_idx" ON "ListingLeadMagicLink"("leadId", "createdAt");

-- AddForeignKey
ALTER TABLE "ListingLead" ADD CONSTRAINT "ListingLead_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingLead" ADD CONSTRAINT "ListingLead_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingLeadMagicLink" ADD CONSTRAINT "ListingLeadMagicLink_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "ListingLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

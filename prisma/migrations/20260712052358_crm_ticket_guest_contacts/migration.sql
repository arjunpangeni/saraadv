-- DropForeignKey
ALTER TABLE "CrmTicket" DROP CONSTRAINT "CrmTicket_buyerId_fkey";

-- AlterTable
ALTER TABLE "CrmTicket" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactName" TEXT,
ALTER COLUMN "buyerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "CrmTicket" ADD CONSTRAINT "CrmTicket_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

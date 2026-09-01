-- Expand public contact form topics beyond carbon and asset management.

ALTER TYPE "ServiceInquiryType" ADD VALUE IF NOT EXISTS 'GENERAL';
ALTER TYPE "ServiceInquiryType" ADD VALUE IF NOT EXISTS 'START_A_BUSINESS';
ALTER TYPE "ServiceInquiryType" ADD VALUE IF NOT EXISTS 'BUY_SELL';
ALTER TYPE "ServiceInquiryType" ADD VALUE IF NOT EXISTS 'PROJECT_BANK';

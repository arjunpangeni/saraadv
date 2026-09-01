-- Postgres Row-Level Security (RLS) foundation for the NDA gate.
--
-- The application connects to Postgres as the table owner (see DATABASE_URL),
-- which always bypasses RLS by default, so enabling RLS below does NOT change
-- current app behavior or the existing application-layer checks in
-- src/lib/listings.ts (hasNdaAccess / canViewFullListing) and the API routes.
--
-- This lays the groundwork for defense-in-depth: any *future* connection
-- (read replica, reporting tool, edge function, or a deliberately
-- non-superuser app role) that authenticates as a role WITHOUT the
-- BYPASSRLS attribute will be restricted to only the NDA-gated rows it is
-- entitled to see, even if application-layer checks are bypassed or buggy.
--
-- To make a session respect these policies, set (per-request, e.g. inside a
-- transaction):
--   SET LOCAL app.current_user_id = '<uuid>';
--   SET LOCAL app.current_role = 'BUYER' | 'ADVISOR' | 'ADMIN' | ...;

ALTER TABLE "NdaAgreement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UnlockRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CrmTicket" ENABLE ROW LEVEL SECURITY;

-- NdaAgreement: visible to the signing buyer, the listing owner, or staff.
CREATE POLICY nda_agreement_access ON "NdaAgreement"
  USING (
    current_setting('app.current_role', true) IN ('ADVISOR', 'ADMIN')
    OR "buyerId" = current_setting('app.current_user_id', true)
    OR EXISTS (
      SELECT 1 FROM "Listing" l
      WHERE l.id = "NdaAgreement"."listingId"
        AND l."ownerId" = current_setting('app.current_user_id', true)
    )
  );

-- UnlockRequest: same visibility rule as NdaAgreement.
CREATE POLICY unlock_request_access ON "UnlockRequest"
  USING (
    current_setting('app.current_role', true) IN ('ADVISOR', 'ADMIN')
    OR "buyerId" = current_setting('app.current_user_id', true)
    OR EXISTS (
      SELECT 1 FROM "Listing" l
      WHERE l.id = "UnlockRequest"."listingId"
        AND l."ownerId" = current_setting('app.current_user_id', true)
    )
  );

-- CrmTicket: staff-only (deal desk), or the buyer who generated the ticket.
CREATE POLICY crm_ticket_access ON "CrmTicket"
  USING (
    current_setting('app.current_role', true) IN ('ADVISOR', 'ADMIN')
    OR "buyerId" = current_setting('app.current_user_id', true)
  );

-- A restricted role for future direct/reporting connections that must
-- respect the policies above (regular Postgres roles are RLS-restricted by
-- default; only the table owner and superusers bypass RLS unless FORCE ROW
-- LEVEL SECURITY is also set on the table).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sara_gated_reader') THEN
    CREATE ROLE sara_gated_reader LOGIN PASSWORD 'change_me_in_production' NOBYPASSRLS;
  END IF;
END
$$;

DO $$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO sara_gated_reader', current_database());
END
$$;

GRANT USAGE ON SCHEMA public TO sara_gated_reader;
GRANT SELECT ON "NdaAgreement", "UnlockRequest", "CrmTicket", "Listing" TO sara_gated_reader;

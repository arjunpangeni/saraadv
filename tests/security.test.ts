import { describe, expect, it } from "vitest";
import { canViewFullListing } from "@/lib/listings";
import { requiresInvestorVerification } from "@/lib/investor-access";
import { isOwnedObjectKey, sniffUploadKind } from "@/lib/file-type";
import { rateLimit } from "@/lib/rate-limit";
import { isDeskRole } from "@/lib/rbac";

describe("investor KYC", () => {
  it("requires verification for sellers and entrepreneurs", () => {
    expect(requiresInvestorVerification("SELLER")).toBe(true);
    expect(requiresInvestorVerification("ENTREPRENEUR")).toBe(true);
    expect(requiresInvestorVerification("BUYER")).toBe(true);
    expect(requiresInvestorVerification("ADVISOR")).toBe(false);
    expect(requiresInvestorVerification("ADMIN")).toBe(false);
  });

  it("does not unlock another listing without NDA and KYC", () => {
    expect(canViewFullListing("SELLER", false, true, false)).toBe(false);
    expect(canViewFullListing("SELLER", false, true, true)).toBe(true);
    expect(canViewFullListing("SELLER", true, false, false)).toBe(true);
    expect(canViewFullListing("ADVISOR", false, false, false)).toBe(true);
  });
});

describe("storage keys", () => {
  it("rejects keys outside the user prefix", () => {
    expect(isOwnedObjectKey("listings/abc/1.pdf", "abc", "listings/")).toBe(true);
    expect(isOwnedObjectKey("listings/other/1.pdf", "abc", "listings/")).toBe(false);
    expect(isOwnedObjectKey("listings/abc/../etc/passwd", "abc", "listings/")).toBe(false);
  });

  it("sniffs pdf magic bytes", () => {
    expect(sniffUploadKind(Buffer.from("%PDF-1.7"))).toBe("pdf");
    expect(sniffUploadKind(Buffer.from("not-a-pdf"))).toBeNull();
  });
});

describe("rate limit", () => {
  it("blocks after the limit", () => {
    const key = `test-${Date.now()}`;
    expect(rateLimit(key, 2, 60_000).ok).toBe(true);
    expect(rateLimit(key, 2, 60_000).ok).toBe(true);
    expect(rateLimit(key, 2, 60_000).ok).toBe(false);
  });
});

describe("desk roles", () => {
  it("identifies advisor and admin", () => {
    expect(isDeskRole("ADMIN")).toBe(true);
    expect(isDeskRole("SELLER")).toBe(false);
  });
});

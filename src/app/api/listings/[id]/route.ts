import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { listingWizardSchema, listingValidationErrors } from "@/types/listing";
import { deleteListingAsAdvisor, updateListing } from "@/lib/listings";
import { isOwnedObjectKey } from "@/lib/file-type";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "listing:manageOwn")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limited = rateLimit(`listing-update:${session.user.id}`, 20, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(rateLimitResponse(limited.retryAfter), { status: 429 });
  }

  const { id } = await params;
  const asAdvisor = can(session.user.role, "crm:manage");
  const body = await req.json();
  const parsed = listingWizardSchema.safeParse(body);
  if (!parsed.success) {
    const { summary } = listingValidationErrors(parsed.error);
    return NextResponse.json({ error: summary[0] || "Please review the form.", details: summary }, { status: 400 });
  }

  if (asAdvisor) {
    const existingDocs = await prisma.document.findMany({
      where: { listingId: id },
      select: { s3Key: true },
    });
    const allowed = new Set(existingDocs.map((d) => d.s3Key));
    const stolenKey = parsed.data.documentKeys?.some(
      (d) => !allowed.has(d.key) && !isOwnedObjectKey(d.key, session.user.id, "listings/")
    );
    if (stolenKey) {
      return NextResponse.json({ error: "Invalid document upload." }, { status: 400 });
    }
  } else {
    const stolenKey = parsed.data.documentKeys?.some(
      (d) => !isOwnedObjectKey(d.key, session.user.id, "listings/")
    );
    if (stolenKey) {
      return NextResponse.json({ error: "Invalid document upload." }, { status: 400 });
    }
  }

  try {
    const listing = await updateListing(session.user.id, id, parsed.data, {
      asAdvisor,
      actorId: session.user.id,
    });
    return NextResponse.json({ id: listing.id, hashId: listing.hashId, status: listing.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "NOT_FOUND") {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }
    if (message === "LOCKED") {
      return NextResponse.json({ error: "This listing can no longer be edited." }, { status: 409 });
    }
    throw err;
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "crm:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const listing = await deleteListingAsAdvisor(id, session.user.id);
    return NextResponse.json({ ok: true, hashId: listing.hashId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "NOT_FOUND") {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }
    throw err;
  }
}

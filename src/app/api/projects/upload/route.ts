import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { uploadObject } from "@/lib/storage";
import { sniffUploadKind, contentTypeForKind, extForKind } from "@/lib/file-type";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const HERO_MAX_BYTES = 2 * 1024 * 1024;
const VAULT_MAX_BYTES = 10 * 1024 * 1024;
const HERO_KINDS = new Set(["jpeg", "png", "webp"]);
const VAULT_KINDS = new Set(["pdf"]);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "project:create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limited = rateLimit(`upload-project:${session.user.id}`, 20, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(rateLimitResponse(limited.retryAfter), { status: 429 });
  }

  const formData = await req.formData();
  const purpose = formData.get("purpose") === "vault" ? "vault" : "hero";
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const maxBytes = purpose === "vault" ? VAULT_MAX_BYTES : HERO_MAX_BYTES;
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: purpose === "vault" ? "PDF must be under 10 MB" : "Image must be under 2 MB" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = sniffUploadKind(buffer);
  const allowed = purpose === "vault" ? VAULT_KINDS : HERO_KINDS;
  if (!kind || !allowed.has(kind)) {
    return NextResponse.json(
      { error: purpose === "vault" ? "Only PDF files are allowed" : "Only JPEG, PNG, and WebP images are allowed" },
      { status: 400 }
    );
  }

  const folder = purpose === "vault" ? `projects/${session.user.id}/vault` : `projects/${session.user.id}`;
  const key = `${folder}/${Date.now()}.${extForKind(kind)}`;
  await uploadObject(key, buffer, contentTypeForKind(kind));

  return NextResponse.json({ key }, { status: 201 });
}

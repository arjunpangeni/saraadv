import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { uploadObject } from "@/lib/storage";
import { sniffUploadKind, contentTypeForKind, extForKind } from "@/lib/file-type";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set<string>(["pdf", "jpeg", "png", "xlsx"]);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "listing:create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limited = rateLimit(`upload-listing:${session.user.id}`, 30, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(rateLimitResponse(limited.retryAfter), { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File must be under 10 MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = sniffUploadKind(buffer);
  if (!kind || !ALLOWED.has(kind)) {
    return NextResponse.json({ error: "PDF, images, or Excel files only" }, { status: 400 });
  }

  const key = `listings/${session.user.id}/${Date.now()}.${extForKind(kind)}`;
  await uploadObject(key, buffer, contentTypeForKind(kind));

  return NextResponse.json({ key }, { status: 201 });
}

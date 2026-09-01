import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { LOCAL_STORAGE_DIR, verifyLocalDownload } from "@/lib/storage";

/** Local-disk fallback file server. Requires an HMAC-signed expiring URL. */
export async function GET(req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const { searchParams } = new URL(req.url);
  const exp = Number(searchParams.get("exp") || 0);
  const sig = searchParams.get("sig") || "";

  const relativePath = key.map((part) => decodeURIComponent(part)).join("/");
  if (!relativePath || relativePath.includes("..") || path.isAbsolute(relativePath)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  if (!verifyLocalDownload(relativePath, exp, sig)) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 403 });
  }

  const fullPath = path.join(LOCAL_STORAGE_DIR, relativePath);
  const resolved = path.resolve(fullPath);
  const root = path.resolve(LOCAL_STORAGE_DIR);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const buffer = await readFile(resolved);
    const ext = relativePath.split(".").pop()?.toLowerCase();
    const contentType =
      ext === "pdf"
        ? "application/pdf"
        : ext === "png"
          ? "image/png"
          : ext === "jpg" || ext === "jpeg"
            ? "image/jpeg"
            : ext === "webp"
              ? "image/webp"
              : "application/octet-stream";
    const filename = relativePath.split("/").pop() || "download";
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

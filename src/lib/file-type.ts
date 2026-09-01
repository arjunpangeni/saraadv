const PDF = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF
const JPEG = Buffer.from([0xff, 0xd8, 0xff]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
const ZIP = Buffer.from([0x50, 0x4b]); // xlsx / zip
const WEBP_RIFF = Buffer.from("RIFF", "ascii");
const WEBP_WEBP = Buffer.from("WEBP", "ascii");

function startsWith(buf: Buffer, magic: Buffer, offset = 0) {
  if (buf.length < offset + magic.length) return false;
  return magic.equals(buf.subarray(offset, offset + magic.length));
}

/** Sniff a small set of deal-room file types from magic bytes (not client MIME). */
export function sniffUploadKind(buf: Buffer): "pdf" | "jpeg" | "png" | "webp" | "xlsx" | null {
  if (startsWith(buf, PDF)) return "pdf";
  if (startsWith(buf, JPEG)) return "jpeg";
  if (startsWith(buf, PNG)) return "png";
  if (startsWith(buf, WEBP_RIFF) && startsWith(buf, WEBP_WEBP, 8)) return "webp";
  if (startsWith(buf, ZIP)) return "xlsx";
  return null;
}

export function contentTypeForKind(kind: "pdf" | "jpeg" | "png" | "webp" | "xlsx") {
  switch (kind) {
    case "pdf":
      return "application/pdf";
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
}

export function extForKind(kind: "pdf" | "jpeg" | "png" | "webp" | "xlsx") {
  switch (kind) {
    case "jpeg":
      return "jpg";
    default:
      return kind;
  }
}

export function isOwnedObjectKey(key: string, userId: string, prefix: string) {
  const expected = `${prefix}${userId}/`;
  if (!key.startsWith(expected)) return false;
  if (key.includes("..") || key.includes("\\") || key.includes("//")) return false;
  return key.length < 512;
}

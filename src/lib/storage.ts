import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse } from "cloudinary";
import { createHmac, timingSafeEqual } from "crypto";
import { writeFile, mkdir, unlink, access } from "fs/promises";
import path from "path";

/**
 * Cloudinary object storage. Regulatory attachments, pitch decks, photos, and
 * generated teaser PDFs are stored here (never in Postgres). Falls back to
 * local disk under ./.storage when Cloudinary credentials are not configured,
 * so the app runs out of the box in dev.
 *
 * Database columns still named `s3Key` hold these storage keys (public IDs).
 */

const LOCAL_STORAGE_DIR = path.join(process.cwd(), ".storage");

const IMAGE_FORMATS = new Set(["jpg", "jpeg", "png", "webp"]);

function hasCloudinaryConfig(): boolean {
  if (process.env.CLOUDINARY_URL) return true;
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

let cloudinaryReady = false;

function ensureCloudinary() {
  if (cloudinaryReady) return;
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ secure: true });
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
  cloudinaryReady = true;
}

function assertStorageKey(key: string) {
  if (!key || key.includes("..") || key.startsWith("/") || key.includes("\\")) {
    throw new Error("Invalid storage key");
  }
}

function parseStorageKey(key: string): { publicId: string; format: string } {
  const slash = key.lastIndexOf("/");
  const filename = slash >= 0 ? key.slice(slash + 1) : key;
  const dot = filename.lastIndexOf(".");
  if (dot <= 0) {
    return { publicId: key, format: "" };
  }
  const format = filename.slice(dot + 1).toLowerCase();
  return { publicId: key.slice(0, key.length - format.length - 1), format };
}

function resourceTypeForFormat(format: string): "image" | "raw" {
  return IMAGE_FORMATS.has(format) ? "image" : "raw";
}

function localPathForKey(key: string): string {
  const fullPath = path.join(LOCAL_STORAGE_DIR, key);
  if (!fullPath.startsWith(LOCAL_STORAGE_DIR)) {
    throw new Error("Invalid storage key");
  }
  return fullPath;
}

async function localFileExists(key: string): Promise<boolean> {
  try {
    await access(localPathForKey(key));
    return true;
  } catch {
    return false;
  }
}

function localDownloadUrl(key: string, expiresInSeconds: number): string {
  const exp = Date.now() + expiresInSeconds * 1000;
  const sig = signLocalDownload(key, exp);
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL || "http://localhost:3000";
  const encoded = key.split("/").map(encodeURIComponent).join("/");
  return `${base}/api/storage/${encoded}?exp=${exp}&sig=${sig}`;
}

function signingSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
}

export function signLocalDownload(key: string, exp: number): string {
  return createHmac("sha256", signingSecret()).update(`${key}:${exp}`).digest("hex");
}

export function verifyLocalDownload(key: string, exp: number, sig: string): boolean {
  if (!signingSecret() || !exp || !sig || !/^[a-f0-9]{64}$/i.test(sig)) return false;
  if (Date.now() > exp) return false;
  const expected = signLocalDownload(key, exp);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(sig, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function uploadBuffer(body: Buffer | Uint8Array, options: UploadApiOptions): Promise<UploadApiResponse> {
  const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body);
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error || !result) {
        reject(error ?? new Error("Cloudinary upload failed"));
        return;
      }
      resolve(result);
    });
    stream.end(buffer);
  });
}

export async function uploadObject(
  key: string,
  body: Buffer | Uint8Array,
  _contentType = "application/octet-stream"
): Promise<string> {
  assertStorageKey(key);

  if (hasCloudinaryConfig()) {
    ensureCloudinary();
    const { publicId, format } = parseStorageKey(key);
    const resourceType = resourceTypeForFormat(format);
    const imageFormat = format === "jpeg" ? "jpg" : format;
    await uploadBuffer(body, {
      public_id: publicId,
      resource_type: resourceType,
      type: "authenticated",
      overwrite: false,
      unique_filename: false,
      use_filename: false,
      filename_override: key.split("/").pop(),
      ...(resourceType === "image" && imageFormat ? { format: imageFormat } : {}),
    });
    return key;
  }

  const fullPath = localPathForKey(key);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, body);
  return key;
}

/** Returns a temporary download URL. Buyers only receive this after signing an NDA. */
export async function getSignedDownloadUrl(key: string, expiresInSeconds = 300): Promise<string> {
  if (hasCloudinaryConfig() && !(await localFileExists(key))) {
    ensureCloudinary();
    const { publicId, format } = parseStorageKey(key);
    const resourceType = resourceTypeForFormat(format);
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    return cloudinary.utils.private_download_url(publicId, format || "bin", {
      resource_type: resourceType,
      type: "authenticated",
      expires_at: expiresAt,
      attachment: resourceType === "raw",
    });
  }

  return localDownloadUrl(key, expiresInSeconds);
}

export async function deleteObject(key: string): Promise<void> {
  if (!key) return;
  assertStorageKey(key);

  if (hasCloudinaryConfig()) {
    ensureCloudinary();
    const { publicId, format } = parseStorageKey(key);
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceTypeForFormat(format),
      type: "authenticated",
      invalidate: true,
    });
  }

  try {
    await unlink(localPathForKey(key));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}

/** Deletes storage objects from Cloudinary and/or local disk. Failures are logged, not thrown. */
export async function deleteStorageKeys(keys: Iterable<string>, logLabel = "[storage]") {
  const unique = [...new Set([...keys].filter(Boolean))];
  await Promise.all(
    unique.map((key) =>
      deleteObject(key).catch((err) => console.error(`${logLabel} failed to delete file`, key, err))
    )
  );
}

export function isUsingLocalStorage(): boolean {
  return !hasCloudinaryConfig();
}

export { LOCAL_STORAGE_DIR };

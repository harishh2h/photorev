import { fileTypeFromBuffer } from "file-type";

/** Bytes file-type may read from the start of a file (see package docs). */
export const IMAGE_UPLOAD_SNIFF_BYTE_LIMIT = 4100;

export const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
  "image/heic",
  "image/heif",
]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/tiff": ".tiff",
  "image/heic": ".heic",
  "image/heif": ".heic",
};

export class InvalidImageUploadError extends Error {
  readonly code = "INVALID_IMAGE_UPLOAD" as const;

  constructor(message = "Unsupported or invalid image file") {
    super(message);
    this.name = "InvalidImageUploadError";
  }
}

export type UploadHeaderClassification =
  | { readonly status: "allowed"; readonly mime: string }
  | { readonly status: "rejected" }
  | { readonly status: "inconclusive" };

export async function classifyUploadHeader(
  header: Buffer,
): Promise<UploadHeaderClassification> {
  if (header.length === 0) {
    return { status: "rejected" };
  }

  const detected = await fileTypeFromBuffer(header);
  if (!detected) {
    return { status: "inconclusive" };
  }

  if (!ALLOWED_IMAGE_MIMES.has(detected.mime)) {
    return { status: "rejected" };
  }

  return { status: "allowed", mime: detected.mime };
}

export async function detectAllowedImageMime(header: Buffer): Promise<string> {
  if (header.length === 0) {
    throw new InvalidImageUploadError("Empty file");
  }

  const detected = await fileTypeFromBuffer(header);
  if (!detected || !ALLOWED_IMAGE_MIMES.has(detected.mime)) {
    throw new InvalidImageUploadError();
  }

  return detected.mime;
}

export function extensionForDetectedMime(mime: string): string {
  const ext = MIME_TO_EXT[mime];
  if (!ext) {
    throw new InvalidImageUploadError(`Unsupported image type: ${mime}`);
  }
  return ext;
}

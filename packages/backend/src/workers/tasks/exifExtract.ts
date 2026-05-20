import exifr from "exifr";

/** JSON-safe EXIF fields stored under `photos.metadata.exif`. */
export interface PhotoExifRecord {
  readonly capturedAt: string | null;
  readonly offsetTime: string | null;
  readonly make: string | null;
  readonly model: string | null;
  readonly exposureTimeSec: number | null;
  readonly iso: number | null;
  readonly fNumber: number | null;
  readonly focalLengthMm: number | null;
  readonly lensModel: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
}

const EXIF_PICK = [
  "Make",
  "Model",
  "DateTimeOriginal",
  "CreateDate",
  "ModifyDate",
  "OffsetTime",
  "OffsetTimeOriginal",
  "ExposureTime",
  "ISO",
  "ISOSpeedRatings",
  "FNumber",
  "FocalLength",
  "LensModel",
  "latitude",
  "longitude",
] as const;

function asString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

function asIsoDate(v: unknown): string | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString();
  if (typeof v === "string" && v.trim()) {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

function pickIso(tags: Record<string, unknown>): number | null {
  return asNumber(tags.ISO) ?? asNumber(tags.ISOSpeedRatings);
}

function pickCapturedAt(tags: Record<string, unknown>): string | null {
  return (
    asIsoDate(tags.DateTimeOriginal) ??
    asIsoDate(tags.CreateDate) ??
    asIsoDate(tags.ModifyDate)
  );
}

function pickOffsetTime(tags: Record<string, unknown>): string | null {
  return (
    asString(tags.OffsetTimeOriginal) ??
    asString(tags.OffsetTime) ??
    asString(tags.OffsetTimeDigitized)
  );
}

/**
 * Parses camera EXIF from an image file path. Returns null when no EXIF block exists.
 */
export async function extractPhotoExif(
  filePath: string,
): Promise<PhotoExifRecord | null> {
  let tags: Record<string, unknown> | null;
  try {
    tags = (await exifr.parse(filePath, {
      pick: [...EXIF_PICK],
      gps: true,
    })) as Record<string, unknown> | null;
  } catch {
    return null;
  }
  if (!tags || typeof tags !== "object") return null;

  const make = asString(tags.Make);
  const model = asString(tags.Model);
  const capturedAt = pickCapturedAt(tags);
  const iso = pickIso(tags);
  const exposureTimeSec = asNumber(tags.ExposureTime);
  const fNumber = asNumber(tags.FNumber);
  const focalLengthMm = asNumber(tags.FocalLength);
  const lensModel = asString(tags.LensModel);
  const latitude = asNumber(tags.latitude);
  const longitude = asNumber(tags.longitude);

  const hasAny =
    make ||
    model ||
    capturedAt ||
    iso != null ||
    exposureTimeSec != null ||
    fNumber != null ||
    focalLengthMm != null ||
    lensModel ||
    latitude != null ||
    longitude != null;

  if (!hasAny) return null;

  return {
    capturedAt,
    offsetTime: pickOffsetTime(tags),
    make,
    model,
    exposureTimeSec,
    iso,
    fNumber,
    focalLengthMm,
    lensModel,
    latitude,
    longitude,
  };
}

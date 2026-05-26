import crypto from "node:crypto";

export type PhotoContentVariant = "thumbnail" | "preview" | "original";

const DEFAULT_TTL_BY_VARIANT: Record<PhotoContentVariant, number> = {
  thumbnail: 3600,
  preview: 3600,
  original: 900,
};

function signingSecret(): string {
  return process.env.CONTENT_SIGNING_SECRET || process.env.JWT_SECRET || "";
}

function isSigningEnabled(): boolean {
  const raw = process.env.CONTENT_SIGNING_ENABLED;
  return raw === undefined || raw === "1" || raw?.toLowerCase() === "true";
}

function payloadString(
  photoId: string,
  variant: PhotoContentVariant,
  userId: string,
  exp: number,
): string {
  return `${photoId}:${variant}:${userId}:${exp}`;
}

export function signPhotoContentUrl(params: {
  readonly photoId: string;
  readonly variant: PhotoContentVariant;
  readonly userId: string;
  readonly ttlSeconds?: number;
}): { readonly sig: string; readonly exp: number } {
  const ttl = params.ttlSeconds ?? DEFAULT_TTL_BY_VARIANT[params.variant];
  const exp = Math.floor(Date.now() / 1000) + ttl;
  const sig = crypto
    .createHmac("sha256", signingSecret())
    .update(payloadString(params.photoId, params.variant, params.userId, exp))
    .digest("hex");
  return { sig, exp };
}

export function verifyPhotoContentSignature(params: {
  readonly photoId: string;
  readonly variant: PhotoContentVariant;
  readonly userId: string;
  readonly sig: string;
  readonly exp: number;
}): boolean {
  if (!isSigningEnabled()) {
    return false;
  }
  if (!params.sig || !Number.isFinite(params.exp)) {
    return false;
  }
  if (params.exp < Math.floor(Date.now() / 1000)) {
    return false;
  }
  const secret = signingSecret();
  if (!secret) {
    return false;
  }
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payloadString(params.photoId, params.variant, params.userId, params.exp))
    .digest("hex");
  const sigBuf = Buffer.from(params.sig, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");
  if (sigBuf.length !== expectedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}

export function cacheControlForVariant(variant: PhotoContentVariant): string {
  if (variant === "thumbnail") {
    return "private, max-age=86400, immutable";
  }
  if (variant === "preview") {
    return "private, max-age=3600";
  }
  return "private, no-cache";
}

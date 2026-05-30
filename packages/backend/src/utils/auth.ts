import { FastifyReply, FastifyRequest } from "fastify";
import { sendFailure } from "./api-response";
import {
  type PhotoContentVariant,
  verifyPhotoContentSignature,
} from "./content-signature";

export interface AuthUserPayload {
  readonly id: string;
  readonly email?: string;
  readonly name?: string;
}

export function getAuthenticatedUserId(request: FastifyRequest): string {
  const typedRequest = request as FastifyRequest & { user?: AuthUserPayload };
  if (!typedRequest.user || !typedRequest.user.id) {
    throw new Error("Missing authenticated user id");
  }
  return typedRequest.user.id;
}

function parseSignedContentVariant(raw: unknown): PhotoContentVariant {
  const s = raw == null || String(raw).trim() === "" ? "preview" : String(raw).trim().toLowerCase();
  if (s === "thumbnail" || s === "thumb") return "thumbnail";
  if (s === "original" || s === "full") return "original";
  return "preview";
}

/**
 * Allows JWT auth or a valid signed content URL (`uid`, `sig`, `exp` query params).
 */
export async function ensurePhotoContentAccess(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const query = request.query as {
    sig?: string;
    exp?: string | number;
    uid?: string;
    variant?: unknown;
  };
  const params = request.params as { photoId?: string };
  const sig = typeof query.sig === "string" ? query.sig : "";
  const uid = typeof query.uid === "string" ? query.uid : "";
  const exp = Number(query.exp);
  const photoId = typeof params.photoId === "string" ? params.photoId : "";

  if (sig && uid && photoId && Number.isFinite(exp)) {
    const variant = parseSignedContentVariant(query.variant);
    const valid = verifyPhotoContentSignature({
      photoId,
      variant,
      userId: uid,
      sig,
      exp,
    });
    if (valid) {
      (request as any).user = { id: uid };
      return;
    }
    sendFailure(reply, 401, "Invalid or expired content signature", null);
    return;
  }

  await ensureAuthenticated(request, reply);
}

/**
 * The header-based auth bypass is strictly a test affordance. It is only honored when the
 * process is running under the test runner (`NODE_ENV === "test"`), so it can never be used
 * to impersonate a user in development or production deployments.
 */
function isTestAuthBypassAllowed(): boolean {
  return process.env.NODE_ENV === "test";
}

export async function ensureAuthenticated(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (isTestAuthBypassAllowed() && request.headers["x-test-bypass-auth"] === "1") {
    const userIdHeader = request.headers["x-test-user-id"];
    if (typeof userIdHeader === "string" && userIdHeader.length > 0) {
      (request as any).user = { id: userIdHeader };
      return;
    }
  }
  // Verify JWT token
  try {
    await (request as any).jwtVerify();
  } catch (err) {
    request.log.warn({ err }, "Unauthorized");
    sendFailure(reply, 401, "Unauthorized", null);
    return;
  }
}


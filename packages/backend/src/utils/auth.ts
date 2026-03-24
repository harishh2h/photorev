import { FastifyReply, FastifyRequest } from "fastify";
import { sendFailure } from "./api-response";

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

export async function ensureAuthenticated(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  // Test mode bypass for development - remove this in production
  const bypassHeader = request.headers["x-test-bypass-auth"];
  if (bypassHeader === "1") {
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
  }
}


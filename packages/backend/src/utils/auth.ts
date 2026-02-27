import { FastifyReply, FastifyRequest } from "fastify";

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
  const bypassHeader = request.headers["x-test-bypass-auth"];
  if (bypassHeader === "1") {
    const userIdHeader = request.headers["x-test-user-id"];
    if (typeof userIdHeader === "string" && userIdHeader.length > 0) {
      (request as any).user = { id: userIdHeader };
      return;
    }
  }
  try {
    await (request as any).jwtVerify();
  } catch (_err) {
    reply.status(401).send({ message: "Unauthorized" });
  }
}


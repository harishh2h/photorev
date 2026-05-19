import fs from "node:fs";
import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import buildShareLinksService from "../services/share-links.service";
import buildPublicShareService, {
  PublicVariant,
} from "../services/public-share.service";
import { sendFailure, sendSuccess } from "../utils/api-response";

const SHARE_TOKEN_TTL = "12h";

const unlockSchema = {
  params: {
    type: "object",
    required: ["token"],
    properties: { token: { type: "string", minLength: 10, maxLength: 200 } },
    additionalProperties: false,
  },
  body: {
    type: "object",
    properties: { password: { type: ["string", "null"], maxLength: 200 } },
    additionalProperties: false,
  },
};

const tokenOnly = {
  params: {
    type: "object",
    required: ["token"],
    properties: { token: { type: "string", minLength: 10, maxLength: 200 } },
    additionalProperties: false,
  },
};

const photoVariantSchema = {
  params: {
    type: "object",
    required: ["token", "photoId", "variant"],
    properties: {
      token: { type: "string", minLength: 10, maxLength: 200 },
      photoId: { type: "string", format: "uuid" },
      variant: { type: "string", enum: ["thumb", "preview"] },
    },
    additionalProperties: false,
  },
  querystring: {
    type: "object",
    properties: { u: { type: "string", maxLength: 4096 } },
    additionalProperties: false,
  },
};

const photoDownloadSchema = {
  params: {
    type: "object",
    required: ["token", "photoId"],
    properties: {
      token: { type: "string", minLength: 10, maxLength: 200 },
      photoId: { type: "string", format: "uuid" },
    },
    additionalProperties: false,
  },
  querystring: {
    type: "object",
    properties: { u: { type: "string", maxLength: 4096 } },
    additionalProperties: false,
  },
};

interface UnlockPayload {
  readonly kind: "share";
  readonly shareId: string;
  readonly token: string;
}

async function verifyUnlockToken(
  request: FastifyRequest,
  shareToken: string,
): Promise<UnlockPayload | null> {
  const queryToken = (request.query as { u?: string } | undefined)?.u;
  const headerAuth = request.headers["authorization"];
  let raw: string | null = null;
  if (typeof headerAuth === "string" && headerAuth.startsWith("Bearer ")) {
    raw = headerAuth.slice("Bearer ".length);
  } else if (typeof queryToken === "string" && queryToken.length > 0) {
    raw = queryToken;
  }
  if (!raw) return null;
  try {
    const decoded = (await (request.server as any).jwt.verify(raw)) as UnlockPayload | null;
    if (!decoded || decoded.kind !== "share" || decoded.token !== shareToken) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

async function publicShareRoutes(
  fastify: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  const shareSvc = buildShareLinksService(fastify, opts);
  const publicSvc = buildPublicShareService(fastify, opts);

  fastify.post(
    "/share/:token/unlock",
    {
      schema: unlockSchema,
      config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
    },
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const { token } = request.params as { token: string };
      const body = (request.body ?? {}) as { password?: string | null };
      const result = await shareSvc.verifyShareToken(token, body.password ?? null);
      if (!result.ok) {
        const code =
          result.reason === "not_found"
            ? 404
            : result.reason === "expired" || result.reason === "revoked"
              ? 410
              : result.reason === "password_required"
                ? 401
                : 403;
        const msg =
          result.reason === "not_found"
            ? "Share link not found"
            : result.reason === "expired"
              ? "Share link has expired"
              : result.reason === "revoked"
                ? "Share link was revoked"
                : result.reason === "password_required"
                  ? "Password required"
                  : "Incorrect password";
        sendFailure(reply, code, msg, { reason: result.reason });
        return;
      }
      const unlockToken = (fastify as any).jwt.sign(
        { kind: "share", shareId: result.link.id, token } as UnlockPayload,
        { expiresIn: SHARE_TOKEN_TTL },
      );
      sendSuccess(
        reply,
        200,
        {
          unlockToken,
          requiresPassword: result.link.password_hash != null,
        },
        "Share unlocked",
      );
    },
  );

  fastify.get(
    "/share/:token",
    {
      schema: tokenOnly,
      config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    },
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const { token } = request.params as { token: string };
      const link = await shareSvc.loadShareByToken(token);
      if (!link) {
        sendFailure(reply, 404, "Share link not found", null);
        return;
      }
      if (link.revoked_at) {
        sendFailure(reply, 410, "Share link was revoked", null);
        return;
      }
      if (link.expires_at && link.expires_at.getTime() < Date.now()) {
        sendFailure(reply, 410, "Share link has expired", null);
        return;
      }
      if (link.password_hash) {
        const unlock = await verifyUnlockToken(request, token);
        if (!unlock || unlock.shareId !== link.id) {
          sendFailure(reply, 401, "Password required", { requiresPassword: true });
          return;
        }
      }
      const listing = await publicSvc.loadShareListing(link);
      if (!listing) {
        sendFailure(reply, 404, "Share link not found", null);
        return;
      }
      void shareSvc.recordView(link.id);
      sendSuccess(reply, 200, listing, "OK");
    },
  );

  fastify.get(
    "/share/:token/photos/:photoId/:variant",
    {
      schema: photoVariantSchema,
      config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
    },
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const { token, photoId, variant } = request.params as {
        token: string;
        photoId: string;
        variant: PublicVariant;
      };
      const link = await shareSvc.loadShareByToken(token);
      if (!link || link.revoked_at) {
        sendFailure(reply, 404, "Share link not found", null);
        return;
      }
      if (link.expires_at && link.expires_at.getTime() < Date.now()) {
        sendFailure(reply, 410, "Share link has expired", null);
        return;
      }
      if (link.password_hash) {
        const unlock = await verifyUnlockToken(request, token);
        if (!unlock || unlock.shareId !== link.id) {
          sendFailure(reply, 401, "Password required", null);
          return;
        }
      }
      const file = await publicSvc.resolveSharePhotoFile(link.project_id, photoId, variant);
      if (!file) {
        sendFailure(reply, 404, "Photo not available", null);
        return;
      }
      reply.header("Cache-Control", "private, max-age=3600");
      reply.type(file.mimeType);
      return reply.send(fs.createReadStream(file.absolutePath));
    },
  );

  fastify.get(
    "/share/:token/photos/:photoId/download",
    {
      schema: photoDownloadSchema,
      config: { rateLimit: { max: 30, timeWindow: "1 hour" } },
    },
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const { token, photoId } = request.params as { token: string; photoId: string };
      const link = await shareSvc.loadShareByToken(token);
      if (!link || link.revoked_at) {
        sendFailure(reply, 404, "Share link not found", null);
        return;
      }
      if (!link.allow_download) {
        sendFailure(reply, 403, "Download disabled for this share", null);
        return;
      }
      if (link.expires_at && link.expires_at.getTime() < Date.now()) {
        sendFailure(reply, 410, "Share link has expired", null);
        return;
      }
      if (link.password_hash) {
        const unlock = await verifyUnlockToken(request, token);
        if (!unlock || unlock.shareId !== link.id) {
          sendFailure(reply, 401, "Password required", null);
          return;
        }
      }
      const file = await publicSvc.resolveSharePhotoFile(link.project_id, photoId, "original");
      if (!file) {
        sendFailure(reply, 404, "Photo not available", null);
        return;
      }
      const safeName = (file.originalName || `photo-${photoId}.jpg`).replace(/"/g, "");
      reply.header("Cache-Control", "no-store");
      reply.header("Content-Disposition", `attachment; filename="${safeName}"`);
      if (file.fileSize) {
        reply.header("Content-Length", String(file.fileSize));
      }
      reply.type(file.mimeType);
      return reply.send(fs.createReadStream(file.absolutePath));
    },
  );
}

export default publicShareRoutes;

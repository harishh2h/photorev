import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import buildShareLinksService, {
  CreateShareLinkOptions,
} from "../services/share-links.service";
import { sendFailure, sendSuccess } from "../utils/api-response";
import { getAuthenticatedUserId } from "../utils/auth";

export interface ShareLinksHandlerMethods {
  createShareLink: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  getShareLink: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  revokeShareLink: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}

function buildShareLinksHandler(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
): ShareLinksHandlerMethods {
  const service = buildShareLinksService(fastify, _opts);

  return {
    createShareLink: async (request, reply) => {
      const userId = getAuthenticatedUserId(request);
      const paramsRaw = request.params as { projectId: string };
      const body = (request.body ?? {}) as CreateShareLinkOptions;
      const outcome = await service.createOrReplaceShareLink({
        userId,
        projectId: paramsRaw.projectId,
        opts: body,
      });
      if (!outcome.ok) {
        if (outcome.reason === "not_found") {
          sendFailure(reply, 404, "Project not found", null);
          return;
        }
        if (outcome.reason === "forbidden") {
          sendFailure(reply, 403, "Only the project creator can create share links", null);
          return;
        }
        sendFailure(reply, 500, "Could not create share link", null);
        return;
      }
      sendSuccess(reply, 201, outcome.link, "Share link created");
    },
    getShareLink: async (request, reply) => {
      const userId = getAuthenticatedUserId(request);
      const paramsRaw = request.params as { projectId: string };
      const link = await service.getActiveShareLink({
        userId,
        projectId: paramsRaw.projectId,
      });
      sendSuccess(reply, 200, link, link ? "OK" : "No active link");
    },
    revokeShareLink: async (request, reply) => {
      const userId = getAuthenticatedUserId(request);
      const paramsRaw = request.params as { projectId: string; linkId: string };
      const outcome = await service.revokeShareLink({
        userId,
        projectId: paramsRaw.projectId,
        linkId: paramsRaw.linkId,
      });
      if (!outcome.ok) {
        const statusCode = outcome.reason === "not_found" ? 404 : 403;
        sendFailure(
          reply,
          statusCode,
          outcome.reason === "not_found" ? "Share link not found" : "Not allowed to revoke this link",
          null,
        );
        return;
      }
      sendSuccess(reply, 200, null, "Share link revoked");
    },
  };
}

export default buildShareLinksHandler;

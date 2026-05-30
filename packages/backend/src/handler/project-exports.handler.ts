import fs from "node:fs";
import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import buildProjectExportsService from "../services/project-exports.service";
import { sendFailure, sendSuccess } from "../utils/api-response";
import { getAuthenticatedUserId } from "../utils/auth";

export interface ProjectExportsHandlerMethods {
  createExport: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  getExport: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  downloadExport: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}

function buildProjectExportsHandler(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
): ProjectExportsHandlerMethods {
  const service = buildProjectExportsService(fastify, _opts);

  return {
    createExport: async (request, reply) => {
      const userId = getAuthenticatedUserId(request);
      const { projectId } = request.params as { projectId: string };
      const body = request.body as { variant?: string };
      const variant = body.variant === "preview" ? "preview" : "original";

      try {
        const created = await service.createForProject({ userId, projectId, variant });
        if (!created) {
          sendFailure(reply, 404, "Project not found", null);
          return;
        }
        sendSuccess(reply, 201, created, "Export queued");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not start export";
        sendFailure(reply, 400, message, null);
      }
    },

    getExport: async (request, reply) => {
      const userId = getAuthenticatedUserId(request);
      const { projectId, exportId } = request.params as { projectId: string; exportId: string };
      const row = await service.getForProjectMember({ userId, projectId, exportId });
      if (!row) {
        sendFailure(reply, 404, "Export not found", null);
        return;
      }
      sendSuccess(reply, 200, row, "Export status");
    },

    downloadExport: async (request, reply) => {
      const userId = getAuthenticatedUserId(request);
      const { projectId, exportId } = request.params as { projectId: string; exportId: string };
      const file = await service.resolveDownloadForProjectMember({ userId, projectId, exportId });
      if (!file) {
        sendFailure(reply, 404, "Download not available", null);
        return;
      }
      const stat = await fs.promises.stat(file.absolutePath);
      reply.header("Cache-Control", "no-store");
      reply.header("Content-Disposition", `attachment; filename="${file.filename.replace(/"/g, "")}"`);
      reply.header("Content-Length", String(stat.size));
      reply.type("application/zip");
      return reply.send(fs.createReadStream(file.absolutePath));
    },
  };
}

export default buildProjectExportsHandler;

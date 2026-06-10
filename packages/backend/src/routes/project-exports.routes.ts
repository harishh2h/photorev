import { FastifyInstance, FastifyPluginOptions } from "fastify";
import buildProjectExportsHandler from "../handler/project-exports.handler";
import { ensureAuthenticated } from "../utils/auth";

const projectParams = {
  params: {
    type: "object",
    required: ["projectId"],
    properties: { projectId: { type: "string", format: "uuid" } },
    additionalProperties: false,
  },
};

const exportParams = {
  params: {
    type: "object",
    required: ["projectId", "exportId"],
    properties: {
      projectId: { type: "string", format: "uuid" },
      exportId: { type: "string", format: "uuid" },
    },
    additionalProperties: false,
  },
};

const createExportSchema = {
  ...projectParams,
  body: {
    type: "object",
    required: ["variant"],
    properties: {
      variant: { type: "string", enum: ["original", "preview"] },
      scope: { type: "string", enum: ["mine", "team"] },
      filter: {
        type: "string",
        enum: ["all", "liked", "rejected", "unreviewed", "conflicts", "trashed"],
      },
      photoIds: {
        type: "array",
        items: { type: "string", format: "uuid" },
        maxItems: 500,
      },
    },
    additionalProperties: false,
  },
};

async function projectExportsRoutes(
  fastify: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  const handler = buildProjectExportsHandler(fastify, opts);

  fastify.post(
    "/:projectId/exports",
    { schema: createExportSchema, preHandler: ensureAuthenticated },
    handler.createExport,
  );
  fastify.get(
    "/:projectId/exports/:exportId",
    { schema: exportParams, preHandler: ensureAuthenticated },
    handler.getExport,
  );
  fastify.get(
    "/:projectId/exports/:exportId/download",
    { schema: exportParams, preHandler: ensureAuthenticated },
    handler.downloadExport,
  );
}

export default projectExportsRoutes;

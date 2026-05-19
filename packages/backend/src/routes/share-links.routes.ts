import { FastifyInstance, FastifyPluginOptions } from "fastify";
import buildShareLinksHandler from "../handler/share-links.handler";
import { ensureAuthenticated } from "../utils/auth";

const createSchema = {
  params: {
    type: "object",
    required: ["projectId"],
    properties: { projectId: { type: "string", format: "uuid" } },
    additionalProperties: false,
  },
  body: {
    type: "object",
    properties: {
      description: { type: ["string", "null"], maxLength: 500 },
      password: { type: ["string", "null"], minLength: 4, maxLength: 200 },
      showMetadata: { type: "boolean" },
      allowDownload: { type: "boolean" },
      expiresAt: { type: ["string", "null"], format: "date-time" },
    },
    additionalProperties: false,
  },
};

const projectOnlySchema = {
  params: {
    type: "object",
    required: ["projectId"],
    properties: { projectId: { type: "string", format: "uuid" } },
    additionalProperties: false,
  },
};

const revokeSchema = {
  params: {
    type: "object",
    required: ["projectId", "linkId"],
    properties: {
      projectId: { type: "string", format: "uuid" },
      linkId: { type: "string", format: "uuid" },
    },
    additionalProperties: false,
  },
};

async function shareLinksRoutes(
  fastify: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  const handler = buildShareLinksHandler(fastify, opts);
  fastify.post(
    "/projects/:projectId/share-link",
    { schema: createSchema, preHandler: ensureAuthenticated },
    handler.createShareLink,
  );
  fastify.get(
    "/projects/:projectId/share-link",
    { schema: projectOnlySchema, preHandler: ensureAuthenticated },
    handler.getShareLink,
  );
  fastify.delete(
    "/projects/:projectId/share-link/:linkId",
    { schema: revokeSchema, preHandler: ensureAuthenticated },
    handler.revokeShareLink,
  );
}

export default shareLinksRoutes;

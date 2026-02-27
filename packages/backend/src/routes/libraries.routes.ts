import { FastifyInstance, FastifyPluginOptions } from "fastify";
import buildLibrariesHandler from "../handler/libraries.handler";
import { ensureAuthenticated } from "../utils/auth";

const listLibrariesSchema = {
  querystring: {
    type: "object",
    properties: {
      page: { type: "integer", minimum: 1 },
      pageSize: { type: "integer", minimum: 1, maximum: 100 },
      projectId: { type: "string", format: "uuid" },
    },
    additionalProperties: false,
  },
};

const createLibrarySchema = {
  body: {
    type: "object",
    required: ["projectId", "name", "absolutePath"],
    properties: {
      projectId: { type: "string", format: "uuid" },
      name: { type: "string", minLength: 1, maxLength: 255 },
      absolutePath: { type: "string", minLength: 1 },
      description: { type: "string", maxLength: 2000 },
    },
    additionalProperties: false,
  },
};

const libraryIdParamsSchema = {
  params: {
    type: "object",
    required: ["libraryId"],
    properties: {
      libraryId: { type: "string", format: "uuid" },
    },
    additionalProperties: false,
  },
};

const updateLibrarySchema = {
  params: libraryIdParamsSchema.params,
  body: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 1, maxLength: 255 },
      description: { type: ["string", "null"], maxLength: 2000 },
      status: {
        type: "string",
        enum: ["active", "processing", "completed"],
      },
      isActive: { type: "boolean" },
    },
    additionalProperties: false,
  },
};

async function librariesRoutes(
  fastify: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  const handler = buildLibrariesHandler(fastify, opts);

  fastify.get(
    "/",
    { schema: listLibrariesSchema, preHandler: ensureAuthenticated },
    handler.listLibraries,
  );
  fastify.post(
    "/",
    { schema: createLibrarySchema, preHandler: ensureAuthenticated },
    handler.createLibrary,
  );
  fastify.get(
    "/:libraryId",
    { schema: libraryIdParamsSchema, preHandler: ensureAuthenticated },
    handler.getLibrary,
  );
  fastify.patch(
    "/:libraryId",
    {
      schema: updateLibrarySchema,
      preHandler: ensureAuthenticated,
    },
    handler.updateLibrary,
  );
  fastify.post(
    "/:libraryId/archive",
    {
      schema: libraryIdParamsSchema,
      preHandler: ensureAuthenticated,
    },
    handler.archiveLibrary,
  );
}

export default librariesRoutes;


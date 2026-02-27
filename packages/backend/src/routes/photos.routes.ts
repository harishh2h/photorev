import { FastifyInstance, FastifyPluginOptions } from "fastify";
import buildPhotosHandler from "../handler/photos.handler";
import { ensureAuthenticated } from "../utils/auth";

const listPhotosSchema = {
  querystring: {
    type: "object",
    properties: {
      page: { type: "integer", minimum: 1 },
      pageSize: { type: "integer", minimum: 1, maximum: 100 },
      projectId: { type: "string", format: "uuid" },
      libraryId: { type: "string", format: "uuid" },
      search: { type: "string" },
      decision: { type: "integer", enum: [-1, 0, 1] },
    },
    additionalProperties: false,
  },
};

const photoIdParamsSchema = {
  params: {
    type: "object",
    required: ["photoId"],
    properties: {
      photoId: { type: "string", format: "uuid" },
    },
    additionalProperties: false,
  },
};

const updatePhotoSchema = {
  params: photoIdParamsSchema.params,
  body: {
    type: "object",
    properties: {
      metadata: {},
      thumbnailPath: { type: "string" },
    },
    additionalProperties: false,
  },
};

const libraryPhotosParamsSchema = {
  params: {
    type: "object",
    required: ["libraryId"],
    properties: {
      libraryId: { type: "string", format: "uuid" },
    },
    additionalProperties: false,
  },
  querystring: {
    type: "object",
    properties: {
      page: { type: "integer", minimum: 1 },
      pageSize: { type: "integer", minimum: 1, maximum: 100 },
    },
    additionalProperties: false,
  },
};

async function photosRoutes(
  fastify: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  const handler = buildPhotosHandler(fastify, opts);

  fastify.get(
    "/",
    { schema: listPhotosSchema, preHandler: ensureAuthenticated },
    handler.listPhotos,
  );
  fastify.get(
    "/:photoId",
    { schema: photoIdParamsSchema, preHandler: ensureAuthenticated },
    handler.getPhoto,
  );
  fastify.patch(
    "/:photoId",
    { schema: updatePhotoSchema, preHandler: ensureAuthenticated },
    handler.updatePhoto,
  );
  fastify.get(
    "/libraries/:libraryId/photos",
    { schema: libraryPhotosParamsSchema, preHandler: ensureAuthenticated },
    handler.listLibraryPhotos,
  );
}

export default photosRoutes;


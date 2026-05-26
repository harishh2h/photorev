import { FastifyInstance, FastifyPluginOptions } from "fastify";
import buildPhotosHandler from "../handler/photos.handler";
import { ensureAuthenticated, ensurePhotoContentAccess } from "../utils/auth";

const listPhotosSchema = {
  querystring: {
    type: "object",
    properties: {
      page: { type: "integer", minimum: 1 },
      pageSize: { type: "integer", minimum: 1, maximum: 100 },
      projectId: { type: "string", format: "uuid" },
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

const getPhotoContentSchema = {
  params: photoIdParamsSchema.params,
  querystring: {
    type: "object",
    properties: {
      variant: { type: "string", enum: ["thumbnail", "thumb", "preview", "original", "full"] },
      uid: { type: "string", format: "uuid" },
      sig: { type: "string", maxLength: 128 },
      exp: { type: "integer", minimum: 1 },
    },
    additionalProperties: false,
  },
};

const getPhotoContentUrlSchema = {
  params: photoIdParamsSchema.params,
  querystring: {
    type: "object",
    properties: {
      variant: { type: "string", enum: ["thumbnail", "thumb", "preview", "original", "full"] },
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
    "/:photoId/content-url",
    { schema: getPhotoContentUrlSchema, preHandler: ensureAuthenticated },
    handler.getPhotoContentUrl,
  );
  fastify.get(
    "/:photoId/content",
    {
      schema: getPhotoContentSchema,
      preHandler: ensurePhotoContentAccess,
      config: { rateLimit: { max: 240, timeWindow: "1 minute" } },
    },
    handler.streamPhotoContent,
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

  fastify.post("/upload", { preHandler: ensureAuthenticated }, handler.uploadPhoto);
}

export default photosRoutes;

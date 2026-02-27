import { FastifyInstance, FastifyPluginOptions } from "fastify";
import buildPhotoReviewsHandler from "../handler/photo-reviews.handler";
import { ensureAuthenticated } from "../utils/auth";

const upsertReviewSchema = {
  params: {
    type: "object",
    required: ["photoId"],
    properties: {
      photoId: { type: "string", format: "uuid" },
    },
    additionalProperties: false,
  },
  body: {
    type: "object",
    required: ["libraryId"],
    properties: {
      libraryId: { type: "string", format: "uuid" },
      seen: { type: "boolean" },
      decision: { type: ["integer", "null"], enum: [-1, 0, 1, null] },
      renamedTo: { type: ["string", "null"], maxLength: 1024 },
    },
    additionalProperties: false,
  },
};

const listUserReviewsSchema = {
  querystring: {
    type: "object",
    properties: {
      page: { type: "integer", minimum: 1 },
      pageSize: { type: "integer", minimum: 1, maximum: 100 },
      projectId: { type: "string", format: "uuid" },
      libraryId: { type: "string", format: "uuid" },
      decision: { type: "integer", enum: [-1, 0, 1] },
    },
    additionalProperties: false,
  },
};

const listPhotoReviewsSchema = {
  params: {
    type: "object",
    required: ["photoId"],
    properties: {
      photoId: { type: "string", format: "uuid" },
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

async function photoReviewsRoutes(
  fastify: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  const handler = buildPhotoReviewsHandler(fastify, opts);

  fastify.put(
    "/:photoId",
    { schema: upsertReviewSchema, preHandler: ensureAuthenticated },
    handler.upsertReview,
  );
  fastify.get(
    "/me",
    { schema: listUserReviewsSchema, preHandler: ensureAuthenticated },
    handler.listUserReviews,
  );
  fastify.get(
    "/photos/:photoId/reviews",
    { schema: listPhotoReviewsSchema, preHandler: ensureAuthenticated },
    handler.listPhotoReviews,
  );
}

export default photoReviewsRoutes;


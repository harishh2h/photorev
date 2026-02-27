import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import buildPhotoReviewsService, {
  ListPhotoReviewsParams,
  ListUserReviewsFilters,
  UpsertReviewParams,
} from "../services/photo-reviews.service";
import { getAuthenticatedUserId } from "../utils/auth";

export interface PhotoReviewsHandlerMethods {
  upsertReview: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  listUserReviews: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  listPhotoReviews: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}

function buildPhotoReviewsHandler(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
): PhotoReviewsHandlerMethods {
  const service = buildPhotoReviewsService(fastify, _opts);

  const handler: PhotoReviewsHandlerMethods = {
    upsertReview: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const userId = getAuthenticatedUserId(request);
      const paramsRaw = request.params as { photoId: string };
      const body = request.body as {
        libraryId: string;
        seen?: boolean;
        decision?: number | null;
        renamedTo?: string | null;
      };
      const params: UpsertReviewParams = {
        userId,
        photoId: paramsRaw.photoId,
        libraryId: body.libraryId,
        seen: body.seen,
        decision: body.decision,
        renamedTo: body.renamedTo,
      };
      const review = await service.upsertReview(params);
      if (!review) {
        reply.status(403).send({ message: "Not allowed to review this photo" });
        return;
      }
      reply.status(200).send(review);
    },
    listUserReviews: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const userId = getAuthenticatedUserId(request);
      const query = request.query as {
        page?: number;
        pageSize?: number;
        projectId?: string;
        libraryId?: string;
        decision?: number;
      };
      const filters: ListUserReviewsFilters = {
        page: query.page,
        pageSize: query.pageSize,
        projectId: query.projectId,
        libraryId: query.libraryId,
        decision: query.decision,
      };
      const result = await service.listUserReviews(userId, filters);
      reply.status(200).send(result);
    },
    listPhotoReviews: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const userId = getAuthenticatedUserId(request);
      const paramsRaw = request.params as { photoId: string };
      const query = request.query as { page?: number; pageSize?: number };
      const params: ListPhotoReviewsParams = {
        userId,
        photoId: paramsRaw.photoId,
        page: query.page,
        pageSize: query.pageSize,
      };
      const result = await service.listPhotoReviews(params);
      reply.status(200).send(result);
    },
  };

  return handler;
}

export default buildPhotoReviewsHandler;


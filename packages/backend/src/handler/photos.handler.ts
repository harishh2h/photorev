import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import buildPhotosService, {
  GetPhotoParams,
  ListLibraryPhotosParams,
  ListPhotosFilters,
  UpdatePhotoMetadataParams,
} from "../services/photos.service";
import { getAuthenticatedUserId } from "../utils/auth";

export interface PhotosHandlerMethods {
  listPhotos: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  getPhoto: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  listLibraryPhotos: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  updatePhoto: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}

function buildPhotosHandler(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
): PhotosHandlerMethods {
  const service = buildPhotosService(fastify, _opts);

  const handler: PhotosHandlerMethods = {
    listPhotos: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const userId = getAuthenticatedUserId(request);
      const query = request.query as {
        page?: number;
        pageSize?: number;
        projectId?: string;
        libraryId?: string;
        search?: string;
        decision?: number;
      };
      const filters: ListPhotosFilters = {
        page: query.page,
        pageSize: query.pageSize,
        projectId: query.projectId,
        libraryId: query.libraryId,
        search: query.search,
        decision: query.decision,
      };
      const result = await service.listPhotos(filters, userId);
      reply.status(200).send(result);
    },
    getPhoto: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const userId = getAuthenticatedUserId(request);
      const paramsRaw = request.params as { photoId: string };
      const params: GetPhotoParams = {
        userId,
        photoId: paramsRaw.photoId,
      };
      const found = await service.getPhoto(params);
      if (!found) {
        reply.status(404).send({ message: "Photo not found" });
        return;
      }
      reply.status(200).send(found);
    },
    listLibraryPhotos: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const userId = getAuthenticatedUserId(request);
      const paramsRaw = request.params as { libraryId: string };
      const query = request.query as { page?: number; pageSize?: number };
      const params: ListLibraryPhotosParams = {
        userId,
        libraryId: paramsRaw.libraryId,
        page: query.page,
        pageSize: query.pageSize,
      };
      const result = await service.listLibraryPhotos(params);
      reply.status(200).send(result);
    },
    updatePhoto: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const userId = getAuthenticatedUserId(request);
      const paramsRaw = request.params as { photoId: string };
      const body = request.body as { metadata?: unknown; thumbnailPath?: string };
      const params: UpdatePhotoMetadataParams = {
        userId,
        photoId: paramsRaw.photoId,
        metadata: body.metadata,
        thumbnailPath: body.thumbnailPath,
      };
      const updated = await service.updatePhotoMetadata(params);
      if (!updated) {
        reply.status(403).send({ message: "Not allowed to update this photo" });
        return;
      }
      reply.status(200).send(updated);
    },
  };

  return handler;
}

export default buildPhotosHandler;


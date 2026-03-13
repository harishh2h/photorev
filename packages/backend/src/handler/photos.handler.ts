import { randomUUID } from "crypto";
import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import buildPhotosService, {
  GetPhotoParams,
  ListLibraryPhotosParams,
  ListPhotosFilters,
  UpdatePhotoMetadataParams,
} from "../services/photos.service";
import { getAuthenticatedUserId } from "../utils/auth";
import { streamFileToDisk, removeUploadDir } from "../utils/storage";
import { PROCESSING_JOBS_TABLE } from "../models/processing-job";
import type { ProcessingJobType } from "../models/processing-job";

const JOB_TYPES: ProcessingJobType[] = ["thumbnail", "preview", "metadata"];

function getMultipartField(
  fields: Record<string, { value?: string } | { value?: string }[] | undefined>,
  name: string,
): string | undefined {
  const raw = fields[name];
  if (!raw) return undefined;
  const item = Array.isArray(raw) ? raw[0] : raw;
  return item?.value != null ? String(item.value) : undefined;
}

export interface PhotosHandlerMethods {
  listPhotos: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  getPhoto: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  listLibraryPhotos: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  updatePhoto: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  uploadPhoto: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
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

    uploadPhoto: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const userId = getAuthenticatedUserId(request);

      const data = await request.file();
      if (!data) {
        reply.status(400).send({ message: "No file uploaded" });
        return;
      }

      const projectId = getMultipartField(data.fields as Record<string, { value?: string } | { value?: string }[]>, "projectId");
      const libraryId = getMultipartField(data.fields as Record<string, { value?: string } | { value?: string }[]>, "libraryId");

      if (!projectId || !libraryId) {
        reply.status(400).send({
          message: "projectId and libraryId are required; send them as form fields before the file",
        });
        return;
      }

      const canUpload = await service.canUploadToProject({
        userId,
        projectId,
        libraryId,
      });
      if (!canUpload) {
        reply.status(403).send({ message: "Not allowed to upload to this project or library" });
        return;
      }

      const photoId = randomUUID();
      let saved;
      try {
        saved = await streamFileToDisk(
          data.file,
          data.mimetype,
          data.filename,
          projectId,
          photoId,
        );
      } catch (err) {
        reply.status(500).send({ message: "Failed to save file to disk" });
        return;
      }

      let photo;
      try {
        photo = await service.insertPhoto({
          id: photoId,
          project_id: projectId,
          library_id: libraryId,
          original_path: saved.filePath,
          original_name: saved.originalName,
          mime_type: saved.mimeType,
          file_size: saved.fileSize,
          status: "pending",
          width: 0,
          height: 0,
        });
        if (!photo) {
          await removeUploadDir(projectId, photoId);
          reply.status(500).send({ message: "Failed to insert photo into database" });
          return;
        }
      } catch {
        await removeUploadDir(projectId, photoId);
        reply.status(500).send({ message: "Failed to insert photo into database" });
        return;
      }

      try {
        await fastify.db(PROCESSING_JOBS_TABLE).insert(
          JOB_TYPES.map((job_type) => ({
            photo_id: photo.id,
            job_type,
            status: "queued",
          })),
        );
      } catch {
        await fastify.db("photos").where("id", photo.id).del();
        await removeUploadDir(projectId, photoId);
        reply.status(500).send({ message: "Failed to queue processing jobs" });
        return;
      }

      reply.status(201).send({
        message: "Photo uploaded successfully",
        data: { photoId: photo.id },
      });
    },
  };

  return handler;
}

export default buildPhotosHandler;


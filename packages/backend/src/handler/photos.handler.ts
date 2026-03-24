import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import buildPhotosService, {
  GetPhotoParams,
  ListLibraryPhotosParams,
  ListPhotosFilters,
  UpdatePhotoMetadataParams,
} from "../services/photos.service";
import { sendFailure, sendSuccess } from "../utils/api-response";
import { getAuthenticatedUserId } from "../utils/auth";
import { getStorageRoot, streamFileToDisk, removeUploadDir } from "../utils/storage";
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
  streamPhotoContent: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
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
      sendSuccess(reply, 200, result, "OK");
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
        sendFailure(reply, 404, "Photo not found", null);
        return;
      }
      sendSuccess(reply, 200, found, "OK");
    },
    streamPhotoContent: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const userId = getAuthenticatedUserId(request);
      const paramsRaw = request.params as { photoId: string };
      const params: GetPhotoParams = {
        userId,
        photoId: paramsRaw.photoId,
      };
      const photo = await service.getPhoto(params);
      if (!photo) {
        sendFailure(reply, 404, "Photo not found", null);
        return;
      }
      const relative =
        photo.previewPath || photo.thumbnailPath || photo.originalPath;
      if (!relative) {
        sendFailure(reply, 404, "No file available", null);
        return;
      }
      const absolutePath = path.join(getStorageRoot(), relative);
      try {
        await fs.promises.access(absolutePath);
      } catch {
        sendFailure(reply, 404, "File not on disk", null);
        return;
      }
      const mimeType =
        photo.mimeType ||
        (relative.toLowerCase().endsWith(".png")
          ? "image/png"
          : relative.toLowerCase().endsWith(".webp")
            ? "image/webp"
            : "image/jpeg");
      reply.type(mimeType);
      return reply.send(fs.createReadStream(absolutePath));
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
      sendSuccess(reply, 200, result, "OK");
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
        sendFailure(reply, 403, "Not allowed to update this photo", null);
        return;
      }
      sendSuccess(reply, 200, updated, "Photo updated");
    },

    uploadPhoto: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const userId = getAuthenticatedUserId(request);

      const data = await request.file();
      if (!data) {
        sendFailure(reply, 400, "No file uploaded", null);
        return;
      }

      const projectId = getMultipartField(data.fields as Record<string, { value?: string } | { value?: string }[]>, "projectId");
      const libraryId = getMultipartField(data.fields as Record<string, { value?: string } | { value?: string }[]>, "libraryId");

      if (!projectId || !libraryId) {
        sendFailure(
          reply,
          400,
          "projectId and libraryId are required; send them as form fields before the file",
          null,
        );
        return;
      }

      const canUpload = await service.canUploadToProject({
        userId,
        projectId,
        libraryId,
      });
      if (!canUpload) {
        sendFailure(reply, 403, "Not allowed to upload to this project or library", null);
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
      } catch (_err) {
        sendFailure(reply, 500, "Failed to save file to disk", null);
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
          sendFailure(reply, 500, "Failed to insert photo into database", null);
          return;
        }
      } catch (_err) {
        await removeUploadDir(projectId, photoId);
        sendFailure(reply, 500, "Failed to insert photo into database", null);
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
      } catch (_err) {
        await fastify.db("photos").where("id", photo.id).del();
        await removeUploadDir(projectId, photoId);
        sendFailure(reply, 500, "Failed to queue processing jobs", null);
        return;
      }

      sendSuccess(reply, 201, { photoId: photo.id }, "Photo uploaded successfully");
    },
  };

  return handler;
}

export default buildPhotosHandler;

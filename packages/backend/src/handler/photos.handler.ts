import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import buildPhotosService, {
  GetPhotoParams,
  ListPhotosFilters,
  UpdatePhotoMetadataParams,
} from "../services/photos.service";
import { sendFailure, sendSuccess } from "../utils/api-response";
import { getAuthenticatedUserId } from "../utils/auth";
import { getStorageRoot, findPreviewFileAbsolute, streamFileToDisk, removeUploadDir } from "../utils/storage";

function getMimeTypeForImagePath(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".png")) {
    return "image/png";
  }
  if (lower.endsWith(".webp")) {
    return "image/webp";
  }
  if (lower.endsWith(".gif")) {
    return "image/gif";
  }
  if (lower.endsWith(".tif") || lower.endsWith(".tiff")) {
    return "image/tiff";
  }
  return "image/jpeg";
}

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
        search?: string;
        decision?: number;
      };
      const filters: ListPhotosFilters = {
        page: query.page,
        pageSize: query.pageSize,
        projectId: query.projectId,
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
      const storageRoot = getStorageRoot();
      const photoDir = path.join(storageRoot, "photos", photo.projectId, photo.id);
      let absolutePath: string | null = null;
      const diskPreview = await findPreviewFileAbsolute(photoDir);
      if (diskPreview) {
        try {
          await fs.promises.access(diskPreview);
          absolutePath = diskPreview;
        } catch {
          absolutePath = null;
        }
      }
      if (!absolutePath) {
        const relative =
          photo.previewPath || photo.thumbnailPath || photo.originalPath;
        if (!relative) {
          sendFailure(reply, 404, "No file available", null);
          return;
        }
        absolutePath = path.join(storageRoot, relative);
      }
      try {
        await fs.promises.access(absolutePath);
      } catch {
        sendFailure(reply, 404, "File not on disk", null);
        return;
      }
      const mimeType = getMimeTypeForImagePath(absolutePath) || photo.mimeType || "image/jpeg";
      reply.type(mimeType);
      return reply.send(fs.createReadStream(absolutePath));
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

      if (!projectId) {
        sendFailure(
          reply,
          400,
          "projectId is required; send it as a form field before the file",
          null,
        );
        return;
      }

      const canUpload = await service.canUploadToProject({
        userId,
        projectId,
      });
      if (!canUpload) {
        sendFailure(reply, 403, "Not allowed to upload to this project", null);
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

      sendSuccess(reply, 201, { photoId: photo.id }, "Photo uploaded successfully");
    },
  };

  return handler;
}

export default buildPhotosHandler;

import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import buildLibrariesService, {
  ArchiveLibraryParams,
  CreateLibraryParams,
  GetLibraryParams,
  ListLibrariesFilters,
  UpdateLibraryParams,
} from "../services/libraries.service";
import { sendFailure, sendSuccess } from "../utils/api-response";
import { getAuthenticatedUserId } from "../utils/auth";

export interface LibrariesHandlerMethods {
  listLibraries: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  createLibrary: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  getLibrary: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  updateLibrary: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  archiveLibrary: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}

function buildLibrariesHandler(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
): LibrariesHandlerMethods {
  const service = buildLibrariesService(fastify, _opts);

  const handler: LibrariesHandlerMethods = {
    listLibraries: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const userId = getAuthenticatedUserId(request);
      const query = request.query as {
        page?: number;
        pageSize?: number;
        projectId?: string;
      };
      const filters: ListLibrariesFilters = {
        page: query.page,
        pageSize: query.pageSize,
        projectId: query.projectId,
      };
      const result = await service.listLibraries(filters, userId);
      sendSuccess(reply, 200, result, "OK");
    },
    createLibrary: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const userId = getAuthenticatedUserId(request);
      const body = request.body as {
        projectId: string;
        name: string;
        absolutePath: string;
        description?: string;
      };
      const params: CreateLibraryParams = {
        userId,
        projectId: body.projectId,
        name: body.name,
        absolutePath: body.absolutePath,
        description: body.description,
      };
      const created = await service.createLibrary(params);
      if (!created) {
        sendFailure(reply, 403, "Not allowed to create library for this project", null);
        return;
      }
      sendSuccess(reply, 201, created, "Library created");
    },
    getLibrary: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const userId = getAuthenticatedUserId(request);
      const paramsRaw = request.params as { libraryId: string };
      const params: GetLibraryParams = {
        userId,
        libraryId: paramsRaw.libraryId,
      };
      const found = await service.getLibrary(params);
      if (!found) {
        sendFailure(reply, 404, "Library not found", null);
        return;
      }
      sendSuccess(reply, 200, found, "OK");
    },
    updateLibrary: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const userId = getAuthenticatedUserId(request);
      const paramsRaw = request.params as { libraryId: string };
      const body = request.body as {
        name?: string;
        description?: string | null;
        status?: "active" | "processing" | "completed";
        isActive?: boolean;
      };
      const params: UpdateLibraryParams = {
        userId,
        libraryId: paramsRaw.libraryId,
        name: body.name,
        description: body.description,
        status: body.status,
        isActive: body.isActive,
      };
      const updated = await service.updateLibrary(params);
      if (!updated) {
        sendFailure(reply, 403, "Not allowed to update this library", null);
        return;
      }
      sendSuccess(reply, 200, updated, "Library updated");
    },
    archiveLibrary: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const userId = getAuthenticatedUserId(request);
      const paramsRaw = request.params as { libraryId: string };
      const params: ArchiveLibraryParams = {
        userId,
        libraryId: paramsRaw.libraryId,
      };
      const ok = await service.archiveLibrary(params);
      if (!ok) {
        sendFailure(reply, 403, "Not allowed to archive this library", null);
        return;
      }
      sendSuccess(reply, 200, null, "Library archived");
    },
  };

  return handler;
}

export default buildLibrariesHandler;

import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import buildLibrariesService, {
  ArchiveLibraryParams,
  CreateLibraryParams,
  GetLibraryParams,
  ListLibrariesFilters,
  UpdateLibraryParams,
} from "../services/libraries.service";
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
      reply.status(200).send(result);
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
        reply.status(403).send({ message: "Not allowed to create library for this project" });
        return;
      }
      reply.status(201).send(created);
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
        reply.status(404).send({ message: "Library not found" });
        return;
      }
      reply.status(200).send(found);
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
        reply.status(403).send({ message: "Not allowed to update this library" });
        return;
      }
      reply.status(200).send(updated);
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
        reply.status(403).send({ message: "Not allowed to archive this library" });
        return;
      }
      reply.status(204).send();
    },
  };

  return handler;
}

export default buildLibrariesHandler;


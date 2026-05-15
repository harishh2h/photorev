import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import buildProjectsService, {
  ArchiveProjectParams,
  CreateProjectParams,
  DeleteProjectParams,
  ListProjectsFilters,
  ProjectMetadata,
  UpdateProjectParams,
} from "../services/projects.service";
import { sendFailure, sendSuccess } from "../utils/api-response";
import { getAuthenticatedUserId } from "../utils/auth";
import { RootPathValidationError } from "../utils/storage";

export interface ProjectsHandlerMethods {
  listProjects: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  createProject: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  getProject: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  getRandomCoverPhoto: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  updateProject: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  archiveProject: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  deleteProject: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}

function buildProjectsHandler(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
): ProjectsHandlerMethods {
  const service = buildProjectsService(fastify, _opts);

  const handler: ProjectsHandlerMethods = {
    listProjects: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const userId = getAuthenticatedUserId(request);
      const filters: ListProjectsFilters = {
        page: (request.query as any).page,
        pageSize: (request.query as any).pageSize,
        status: (request.query as any).status,
        isActive: (request.query as any).isActive,
      };
      const result = await service.listProjects(filters, userId);
      sendSuccess(reply, 200, result, "OK");
    },
    createProject: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const userId = getAuthenticatedUserId(request);
      const body = request.body as { name: string; rootPath?: string; metadata?: ProjectMetadata };
      const params: CreateProjectParams = {
        userId,
        name: body.name,
        rootPath: body.rootPath,
        metadata: body.metadata,
      };
      let created;
      try {
        created = await service.createProject(params);
      } catch (err: unknown) {
        if (err instanceof RootPathValidationError) {
          sendFailure(reply, 400, err.message, null);
          return;
        }
        throw err;
      }
      sendSuccess(reply, 201, created, "Project created");
    },
    getProject: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const userId = getAuthenticatedUserId(request);
      const params = request.params as { projectId: string };
      const found = await service.getProject({
        userId,
        projectId: params.projectId,
      });
      if (!found) {
        sendFailure(reply, 404, "Project not found", null);
        return;
      }
      sendSuccess(reply, 200, found, "OK");
    },
    getRandomCoverPhoto: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const userId = getAuthenticatedUserId(request);
      const params = request.params as { projectId: string };
      const result = await service.getRandomCoverPhotoId({
        userId,
        projectId: params.projectId,
      });
      if (!result.access) {
        sendFailure(reply, 404, "Project not found", null);
        return;
      }
      sendSuccess(reply, 200, { photoId: result.photoId }, "OK");
    },
    updateProject: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const userId = getAuthenticatedUserId(request);
      const paramsRaw = request.params as { projectId: string };
      const body = request.body as {
        name?: string;
        status?: "active" | "processing" | "completed";
        isActive?: boolean;
        rootPath?: string;
        metadata?: ProjectMetadata;
      };
      const params: UpdateProjectParams = {
        userId,
        projectId: paramsRaw.projectId,
        name: body.name,
        status: body.status,
        isActive: body.isActive,
        rootPath: body.rootPath,
        metadata: body.metadata,
      };
      let updated;
      try {
        updated = await service.updateProject(params);
      } catch (err: unknown) {
        if (err instanceof RootPathValidationError) {
          sendFailure(reply, 400, err.message, null);
          return;
        }
        throw err;
      }
      if (!updated.ok) {
        const statusCode = updated.reason === "not_found" ? 404 : 403;
        const msg =
          updated.reason === "not_found"
            ? "Project not found"
            : "Not allowed to update this project";
        sendFailure(reply, statusCode, msg, null);
        return;
      }
      sendSuccess(reply, 200, updated.project, "Project updated");
    },
    archiveProject: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const userId = getAuthenticatedUserId(request);
      const paramsRaw = request.params as { projectId: string };
      const params: ArchiveProjectParams = {
        userId,
        projectId: paramsRaw.projectId,
      };
      const outcome = await service.archiveProject(params);
      if (!outcome.ok) {
        const statusCode = outcome.reason === "not_found" ? 404 : 403;
        const msg =
          outcome.reason === "not_found"
            ? "Project not found"
            : "Not allowed to archive this project";
        sendFailure(reply, statusCode, msg, null);
        return;
      }
      sendSuccess(reply, 200, null, "Project archived");
    },
    deleteProject: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const userId = getAuthenticatedUserId(request);
      const paramsRaw = request.params as { projectId: string };
      const params: DeleteProjectParams = {
        userId,
        projectId: paramsRaw.projectId,
      };
      const outcome = await service.deleteProject(params);
      if (!outcome.ok) {
        const statusCode = outcome.reason === "not_found" ? 404 : 403;
        const msg =
          outcome.reason === "not_found"
            ? "Project not found"
            : "Not allowed to delete this project";
        sendFailure(reply, statusCode, msg, null);
        return;
      }
      sendSuccess(reply, 200, null, "Project removed");
    },
  };

  return handler;
}

export default buildProjectsHandler;

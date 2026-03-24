import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import buildProjectsService, {
  ArchiveProjectParams,
  CreateProjectParams,
  DeleteProjectParams,
  ListProjectsFilters,
  UpdateProjectParams,
} from "../services/projects.service";
import { sendFailure, sendSuccess } from "../utils/api-response";
import { getAuthenticatedUserId } from "../utils/auth";

export interface ProjectsHandlerMethods {
  listProjects: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  createProject: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  getProject: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
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
      const body = request.body as { name: string; rootPath?: string };
      const params: CreateProjectParams = {
        userId,
        name: body.name,
        rootPath: body.rootPath,
      };
      const created = await service.createProject(params);
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
    updateProject: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const userId = getAuthenticatedUserId(request);
      const paramsRaw = request.params as { projectId: string };
      const body = request.body as {
        name?: string;
        status?: "active" | "processing" | "completed";
        isActive?: boolean;
        rootPath?: string;
      };
      const params: UpdateProjectParams = {
        userId,
        projectId: paramsRaw.projectId,
        name: body.name,
        status: body.status,
        isActive: body.isActive,
        rootPath: body.rootPath,
      };
      const updated = await service.updateProject(params);
      if (!updated) {
        sendFailure(reply, 403, "Not allowed to update this project", null);
        return;
      }
      sendSuccess(reply, 200, updated, "Project updated");
    },
    archiveProject: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const userId = getAuthenticatedUserId(request);
      const paramsRaw = request.params as { projectId: string };
      const params: ArchiveProjectParams = {
        userId,
        projectId: paramsRaw.projectId,
      };
      const ok = await service.archiveProject(params);
      if (!ok) {
        sendFailure(reply, 403, "Not allowed to archive this project", null);
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
      const ok = await service.deleteProject(params);
      if (!ok) {
        sendFailure(reply, 403, "Not allowed to delete this project", null);
        return;
      }
      sendSuccess(reply, 200, null, "Project deleted");
    },
  };

  return handler;
}

export default buildProjectsHandler;

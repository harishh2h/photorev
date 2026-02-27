import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import buildProjectsService, {
  ArchiveProjectParams,
  CreateProjectParams,
  DeleteProjectParams,
  ListProjectsFilters,
  UpdateProjectParams,
} from "../services/projects.service";
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
      reply.status(200).send(result);
    },
    createProject: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const userId = getAuthenticatedUserId(request);
      const body = request.body as { name: string; rootPath: string };
      const params: CreateProjectParams = {
        userId,
        name: body.name,
        rootPath: body.rootPath,
      };
      const created = await service.createProject(params);
      reply.status(201).send(created);
    },
    getProject: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const userId = getAuthenticatedUserId(request);
      const params = request.params as { projectId: string };
      const found = await service.getProject({
        userId,
        projectId: params.projectId,
      });
      if (!found) {
        reply.status(404).send({ message: "Project not found" });
        return;
      }
      reply.status(200).send(found);
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
        reply.status(403).send({ message: "Not allowed to update this project" });
        return;
      }
      reply.status(200).send(updated);
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
        reply.status(403).send({ message: "Not allowed to archive this project" });
        return;
      }
      reply.status(204).send();
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
        reply.status(403).send({ message: "Not allowed to delete this project" });
        return;
      }
      reply.status(204).send();
    },
  };

  return handler;
}

export default buildProjectsHandler;


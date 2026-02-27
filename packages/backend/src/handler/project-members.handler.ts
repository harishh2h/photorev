import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import buildProjectMembersService, {
  AddMemberParams,
  ListMembersParams,
  RemoveMemberParams,
  UpdateMemberParams,
} from "../services/project-members.service";
import { getAuthenticatedUserId } from "../utils/auth";

export interface ProjectMembersHandlerMethods {
  listMembers: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  addMember: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  removeMember: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  updateMember: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}

function buildProjectMembersHandler(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
): ProjectMembersHandlerMethods {
  const service = buildProjectMembersService(fastify, _opts);

  const handler: ProjectMembersHandlerMethods = {
    listMembers: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const requesterId = getAuthenticatedUserId(request);
      const paramsRaw = request.params as { projectId: string };
      const params: ListMembersParams = {
        requesterId,
        projectId: paramsRaw.projectId,
      };
      const members = await service.listMembers(params);
      if (members.length === 0) {
        reply.status(403).send({ message: "Not allowed to view members for this project" });
        return;
      }
      reply.status(200).send(members);
    },
    addMember: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const requesterId = getAuthenticatedUserId(request);
      const paramsRaw = request.params as { projectId: string };
      const body = request.body as { userId: string; isOwner?: boolean };
      const params: AddMemberParams = {
        requesterId,
        projectId: paramsRaw.projectId,
        userId: body.userId,
        isOwner: body.isOwner,
      };
      const member = await service.addMember(params);
      if (!member) {
        reply.status(403).send({ message: "Not allowed to add member to this project" });
        return;
      }
      reply.status(201).send(member);
    },
    removeMember: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const requesterId = getAuthenticatedUserId(request);
      const paramsRaw = request.params as { projectId: string; userId: string };
      const params: RemoveMemberParams = {
        requesterId,
        projectId: paramsRaw.projectId,
        userId: paramsRaw.userId,
      };
      const ok = await service.removeMember(params);
      if (!ok) {
        reply.status(403).send({ message: "Not allowed to remove this member" });
        return;
      }
      reply.status(204).send();
    },
    updateMember: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const requesterId = getAuthenticatedUserId(request);
      const paramsRaw = request.params as { projectId: string; userId: string };
      const body = request.body as { isOwner: boolean };
      const params: UpdateMemberParams = {
        requesterId,
        projectId: paramsRaw.projectId,
        userId: paramsRaw.userId,
        isOwner: body.isOwner,
      };
      const member = await service.updateMember(params);
      if (!member) {
        reply.status(403).send({ message: "Not allowed to update this member" });
        return;
      }
      reply.status(200).send(member);
    },
  };

  return handler;
}

export default buildProjectMembersHandler;


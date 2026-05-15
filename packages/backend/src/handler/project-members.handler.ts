import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import buildProjectMembersService, {
  AddMemberParams,
  ListMembersParams,
  LookupMemberByEmailParams,
  RemoveMemberParams,
  UpdateMemberRoleParams,
} from "../services/project-members.service";
import { sendFailure, sendSuccess } from "../utils/api-response";
import { getAuthenticatedUserId } from "../utils/auth";
import { isPlausibleEmailShape, normalizeEmail } from "../utils/email";
import type { CollaboratorRole } from "../utils/project-permissions";

export interface ProjectMembersHandlerMethods {
  listMembers: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  lookupMemberByEmail: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  addMember: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  removeMember: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  updateMemberRole: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}

function parseCollaboratorRoleBody(raw: unknown): CollaboratorRole | null {
  if (raw === "viewer" || raw === "reviewer" || raw === "contributor") {
    return raw;
  }
  return null;
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
      if (members === null) {
        sendFailure(reply, 404, "Project not found", null);
        return;
      }
      sendSuccess(reply, 200, members, "OK");
    },
    lookupMemberByEmail: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const requesterId = getAuthenticatedUserId(request);
      const paramsRaw = request.params as { projectId: string };
      const query = request.query as { email?: string };
      const rawEmail = typeof query.email === "string" ? query.email : "";
      const trimmed = rawEmail.trim();
      if (!trimmed.length || trimmed.length > 255 || !isPlausibleEmailShape(normalizeEmail(trimmed))) {
        sendFailure(reply, 400, "Invalid email query", null);
        return;
      }
      const params: LookupMemberByEmailParams = {
        requesterId,
        projectId: paramsRaw.projectId,
        normalizedEmail: normalizeEmail(trimmed),
      };
      const result = await service.lookupUserByEmail(params);
      if (!result.allowed) {
        sendFailure(reply, 403, "Not allowed to look up members for this project", null);
        return;
      }
      sendSuccess(reply, 200, { user: result.user }, "OK");
    },
    addMember: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const requesterId = getAuthenticatedUserId(request);
      const paramsRaw = request.params as { projectId: string };
      const body = request.body as { userId: string; role?: unknown };
      const role = parseCollaboratorRoleBody(body.role);
      if (!role) {
        sendFailure(reply, 400, "role must be viewer, reviewer, or contributor", null);
        return;
      }
      const params: AddMemberParams = {
        requesterId,
        projectId: paramsRaw.projectId,
        userId: body.userId,
        role,
      };
      const outcome = await service.addMember(params);
      if (!outcome) {
        sendFailure(reply, 403, "Not allowed to add member to this project", null);
        return;
      }
      const statusCode = outcome.created ? 201 : 200;
      sendSuccess(reply, statusCode, outcome.member, outcome.created ? "Member added" : "Member already on project");
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
        sendFailure(reply, 403, "Not allowed to remove this member", null);
        return;
      }
      sendSuccess(reply, 200, null, "Member removed");
    },
    updateMemberRole: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const requesterId = getAuthenticatedUserId(request);
      const paramsRaw = request.params as { projectId: string; userId: string };
      const body = request.body as { role?: unknown };
      const role = parseCollaboratorRoleBody(body.role);
      if (!role) {
        sendFailure(reply, 400, "role must be viewer, reviewer, or contributor", null);
        return;
      }
      const params: UpdateMemberRoleParams = {
        requesterId,
        projectId: paramsRaw.projectId,
        userId: paramsRaw.userId,
        role,
      };
      const member = await service.updateMemberRole(params);
      if (!member) {
        sendFailure(reply, 403, "Not allowed to update this member", null);
        return;
      }
      sendSuccess(reply, 200, member, "Member updated");
    },
  };

  return handler;
}

export default buildProjectMembersHandler;

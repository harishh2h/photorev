import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import buildProjectMembersHandler from "../handler/project-members.handler";
import { ensureAuthenticated } from "../utils/auth";

function memberLookupRateLimitKey(request: FastifyRequest): string {
  const user = (request as FastifyRequest & { user?: { id?: string } }).user;
  const uid = typeof user?.id === "string" ? user.id : "anon";
  return `${request.ip}:${uid}`;
}

const projectMembersParamsSchema = {
  params: {
    type: "object",
    required: ["projectId"],
    properties: {
      projectId: { type: "string", format: "uuid" },
    },
    additionalProperties: false,
  },
};

const lookupMemberQuerySchema = {
  ...projectMembersParamsSchema,
  querystring: {
    type: "object",
    required: ["email"],
    properties: {
      email: { type: "string", minLength: 1, maxLength: 255 },
    },
    additionalProperties: false,
  },
};

const addMemberSchema = {
  params: {
    type: "object",
    required: ["projectId"],
    properties: {
      projectId: { type: "string", format: "uuid" },
    },
    additionalProperties: false,
  },
  body: {
    type: "object",
    required: ["userId", "role"],
    properties: {
      userId: { type: "string", format: "uuid" },
      role: { type: "string", enum: ["viewer", "reviewer", "contributor"] },
    },
    additionalProperties: false,
  },
};

const memberWithUserParamsSchema = {
  params: {
    type: "object",
    required: ["projectId", "userId"],
    properties: {
      projectId: { type: "string", format: "uuid" },
      userId: { type: "string", format: "uuid" },
    },
    additionalProperties: false,
  },
};

const updateMemberRoleSchema = {
  ...memberWithUserParamsSchema,
  body: {
    type: "object",
    required: ["role"],
    properties: {
      role: { type: "string", enum: ["viewer", "reviewer", "contributor"] },
    },
    additionalProperties: false,
  },
};

async function projectMembersRoutes(
  fastify: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  const handler = buildProjectMembersHandler(fastify, opts);

  fastify.get(
    "/projects/:projectId/members",
    { schema: projectMembersParamsSchema, preHandler: ensureAuthenticated },
    handler.listMembers,
  );
  fastify.get(
    "/projects/:projectId/members/lookup",
    {
      schema: lookupMemberQuerySchema,
      preHandler: [
        ensureAuthenticated,
        fastify.rateLimit({
          max: 40,
          timeWindow: "1 minute",
          keyGenerator: memberLookupRateLimitKey,
        }),
      ],
    },
    handler.lookupMemberByEmail,
  );
  fastify.post(
    "/projects/:projectId/members",
    { schema: addMemberSchema, preHandler: ensureAuthenticated },
    handler.addMember,
  );
  fastify.delete(
    "/projects/:projectId/members/:userId",
    { schema: memberWithUserParamsSchema, preHandler: ensureAuthenticated },
    handler.removeMember,
  );
  fastify.patch(
    "/projects/:projectId/members/:userId",
    { schema: updateMemberRoleSchema, preHandler: ensureAuthenticated },
    handler.updateMemberRole,
  );
}

export default projectMembersRoutes;

import { FastifyInstance, FastifyPluginOptions } from "fastify";
import buildProjectMembersHandler from "../handler/project-members.handler";
import { ensureAuthenticated } from "../utils/auth";

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
    required: ["userId"],
    properties: {
      userId: { type: "string", format: "uuid" },
      isOwner: { type: "boolean" },
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

const updateMemberSchema = {
  ...memberWithUserParamsSchema,
  body: {
    type: "object",
    required: ["isOwner"],
    properties: {
      isOwner: { type: "boolean" },
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
    { schema: updateMemberSchema, preHandler: ensureAuthenticated },
    handler.updateMember,
  );
}

export default projectMembersRoutes;


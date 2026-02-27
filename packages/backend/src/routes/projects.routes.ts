import { FastifyInstance, FastifyPluginOptions } from "fastify";
import buildProjectsHandler from "../handler/projects.handler";
import { ensureAuthenticated } from "../utils/auth";

const listProjectsSchema = {
  querystring: {
    type: "object",
    properties: {
      page: { type: "integer", minimum: 1 },
      pageSize: { type: "integer", minimum: 1, maximum: 100 },
      status: {
        type: "string",
        enum: ["active", "processing", "completed"],
      },
      isActive: {
        type: "boolean",
      },
    },
    additionalProperties: false,
  },
};

const createProjectSchema = {
  body: {
    type: "object",
    required: ["name", "rootPath"],
    properties: {
      name: { type: "string", minLength: 1, maxLength: 255 },
      rootPath: { type: "string", minLength: 1 },
    },
    additionalProperties: false,
  },
};

const updateProjectSchema = {
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
    properties: {
      name: { type: "string", minLength: 1, maxLength: 255 },
      status: {
        type: "string",
        enum: ["active", "processing", "completed"],
      },
      isActive: { type: "boolean" },
      rootPath: { type: "string", minLength: 1 },
    },
    additionalProperties: false,
  },
};

const singleProjectParamsSchema = {
  params: {
    type: "object",
    required: ["projectId"],
    properties: {
      projectId: { type: "string", format: "uuid" },
    },
    additionalProperties: false,
  },
};

async function projectsRoutes(
  fastify: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  const handler = buildProjectsHandler(fastify, opts);

  fastify.get(
    "/",
    { schema: listProjectsSchema, preHandler: ensureAuthenticated },
    handler.listProjects,
  );
  fastify.post(
    "/",
    { schema: createProjectSchema, preHandler: ensureAuthenticated },
    handler.createProject,
  );
  fastify.get(
    "/:projectId",
    { schema: singleProjectParamsSchema, preHandler: ensureAuthenticated },
    handler.getProject,
  );
  fastify.patch(
    "/:projectId",
    { schema: updateProjectSchema, preHandler: ensureAuthenticated },
    handler.updateProject,
  );
  fastify.post(
    "/:projectId/archive",
    { schema: singleProjectParamsSchema, preHandler: ensureAuthenticated },
    handler.archiveProject,
  );
  fastify.delete(
    "/:projectId",
    { schema: singleProjectParamsSchema, preHandler: ensureAuthenticated },
    handler.deleteProject,
  );
}

export default projectsRoutes;


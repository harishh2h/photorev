import { FastifyInstance, FastifyPluginOptions } from "fastify";
import authRoutes from "./auth.routes";
import adminRoutes from "./admin.routes";
import projectMembersRoutes from "./project-members.routes";
import photosRoutes from "./photos.routes";
import photoReviewsRoutes from "./photo-reviews.routes";
import projectsRoutes from "./projects.routes";
import projectExportsRoutes from "./project-exports.routes";
import shareLinksRoutes from "./share-links.routes";
import publicShareRoutes from "./public-share.routes";
import { sendSuccess } from "../utils/api-response";

async function routes(fastify: FastifyInstance, opts: FastifyPluginOptions): Promise<void> {
  fastify.get("/health", (_request, reply) => {
    sendSuccess(reply, 200, null, "ok");
  });
  fastify.register(authRoutes, { prefix: "/auth" });
  fastify.register(adminRoutes, { prefix: "/admin" });
  fastify.register(projectsRoutes, { prefix: "/projects" });
  fastify.register(projectExportsRoutes, { prefix: "/projects" });
  fastify.register(projectMembersRoutes);
  fastify.register(photosRoutes, { prefix: "/photos" });
  fastify.register(photoReviewsRoutes, { prefix: "/photo-reviews" });
  fastify.register(shareLinksRoutes);
  fastify.register(publicShareRoutes, { prefix: "/public" });
}

export default routes;
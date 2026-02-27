import { FastifyInstance, FastifyPluginOptions } from "fastify";
import authRoutes from "./auth.routes";
import projectMembersRoutes from "./project-members.routes";
import librariesRoutes from "./libraries.routes";
import photosRoutes from "./photos.routes";
import photoReviewsRoutes from "./photo-reviews.routes";
import projectsRoutes from "./projects.routes";

async function routes(fastify: FastifyInstance, opts: FastifyPluginOptions): Promise<void> {
  fastify.get("/health", (request, reply) => {
    reply.send({ message: "ok" });
  });
  fastify.register(authRoutes, { prefix: "/auth" });
  fastify.register(projectsRoutes, { prefix: "/projects" });
  fastify.register(projectMembersRoutes);
  fastify.register(librariesRoutes, { prefix: "/libraries" });
  fastify.register(photosRoutes, { prefix: "/photos" });
  fastify.register(photoReviewsRoutes, { prefix: "/photo-reviews" });
}

export default routes;
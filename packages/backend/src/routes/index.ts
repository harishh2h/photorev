import { FastifyInstance, FastifyPluginOptions } from "fastify";
import authRoutes from "./auth.routes";

async function routes(fastify: FastifyInstance, opts: FastifyPluginOptions): Promise<void> {
    fastify.register(authRoutes, { prefix: '/auth' })

}

export default routes;
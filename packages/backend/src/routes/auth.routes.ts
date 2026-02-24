import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { RegisterSchema } from "../utils/types";

async function authRoutes(fastify: FastifyInstance, opts: FastifyPluginOptions): Promise<void> {
    fastify.post('/register', {schema : RegisterSchema} ,async (request, reply) => {
        return reply.status(200).send({ message: 'Hello World' });
    });
}

export default authRoutes;
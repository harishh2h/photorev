import { FastifyPluginAsync, FastifyReply, FastifyRequest,  } from "fastify";
import fastifyJwt from "@fastify/jwt";

const jwtPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.register(fastifyJwt, {
        secret: process.env.JWT_SECRET as string,
        sign: {
            expiresIn: '7d',
        },
    });

    fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.status(401).send({ message: 'Unauthorized' });
        }
    });
}

export default jwtPlugin;
import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify'

interface AuthHandlerMethods {
    registerUser: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
}

function buildAuthHandler(fastify: FastifyInstance, _opts: FastifyPluginOptions): AuthHandlerMethods {
    const handler: AuthHandlerMethods = {
        registerUser: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            const body = request.body as { email: string; password: string }
            // TODO: call authService.register(body, fastify.db), then reply.status(201).send(...)
            return reply.status(201).send({ message: 'Registered', email: body.email })
        },
    }
    return handler
}

export default buildAuthHandler
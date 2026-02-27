import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import buildAuthService from '../services/auth.service';
interface AuthHandlerMethods {
    registerUser: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    loginUser: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}

function buildAuthHandler(fastify: FastifyInstance, _opts: FastifyPluginOptions): AuthHandlerMethods {
    
    const authService = buildAuthService(fastify, _opts);
    const handler: AuthHandlerMethods = {
        registerUser: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            const body = request.body as { email: string; password: string; name: string };
            const result = await authService.registerUser(body);
            if (result.success) {
                return reply.status(201).send({ message: result.message });
            } else {
                return reply.status(400).send({ message: result.message });
            }
        },
        loginUser: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            const body = request.body as { email: string; password: string };
            const result = await authService.loginUser(body);
            if (!result.success || !result.data || !result.token) {
                return reply.status(401).send({ message: result.message });
            }
            return reply.status(200).send({
                token: result.token,
                user: {
                    id: result.data.id,
                    email: result.data.email,
                    name: result.data.name,
                },
            });
        },
    };
    return handler;
}

export default buildAuthHandler
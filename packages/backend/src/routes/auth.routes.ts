import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { RegisterSchema, LoginSchema } from '../utils/types';
import buildAuthHandler from '../handler/auth.handler';

async function authRoutes(fastify: FastifyInstance, opts: FastifyPluginOptions): Promise<void> {
    const authHandler = buildAuthHandler(fastify, opts);
    fastify.post('/register', { schema: RegisterSchema }, authHandler.registerUser);
    fastify.post('/login', { schema: LoginSchema }, authHandler.loginUser);
}

export default authRoutes
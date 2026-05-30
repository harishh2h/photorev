import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { RegisterSchema, LoginSchema, SetupSchema } from '../utils/types';
import buildAuthHandler from '../handler/auth.handler';
import { ensureAuthenticated } from '../utils/auth';

async function authRoutes(fastify: FastifyInstance, opts: FastifyPluginOptions): Promise<void> {
    const authHandler = buildAuthHandler(fastify, opts);
    fastify.get('/config', authHandler.getAuthConfig);
    fastify.post(
        '/setup',
        { schema: SetupSchema },
        authHandler.adminSignUp,
    );
    fastify.post(
        '/register',
        { schema: RegisterSchema, config: { rateLimit: { max: 10, timeWindow: '1 hour' } } },
        authHandler.registerUser,
    );
    fastify.post(
        '/login',
        { schema: LoginSchema, config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
        authHandler.loginUser,
    );
    fastify.get('/me', { preHandler: ensureAuthenticated }, authHandler.currentUser);
}

export default authRoutes;

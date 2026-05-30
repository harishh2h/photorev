import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import buildAdminHandler from '../handler/admin.handler';
import { ensureAdmin } from '../utils/auth';

async function adminRoutes(fastify: FastifyInstance, opts: FastifyPluginOptions): Promise<void> {
    const adminHandler = buildAdminHandler(fastify, opts);
    fastify.get('/users', { preHandler: ensureAdmin }, adminHandler.listUsers);
    fastify.post('/users', { preHandler: ensureAdmin }, adminHandler.createUser);
    fastify.patch('/users/:userId', { preHandler: ensureAdmin }, adminHandler.updateUser);
    fastify.delete('/users/:userId', { preHandler: ensureAdmin }, adminHandler.deactivateUser);
}

export default adminRoutes;

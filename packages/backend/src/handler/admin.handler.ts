import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import buildAdminService from '../services/admin.service';
import { sendFailure, sendSuccess } from '../utils/api-response';
import { AuthUserPayload } from '../utils/auth';
import { UserRole } from '../models/user';

interface AdminHandlerMethods {
    listUsers: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    createUser: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    updateUser: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    deactivateUser: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}

function buildAdminHandler(fastify: FastifyInstance, opts: FastifyPluginOptions): AdminHandlerMethods {
    const adminService = buildAdminService(fastify, opts);

    const handler: AdminHandlerMethods = {
        listUsers: async (_request, reply) => {
            const result = await adminService.listUsers();
            if (result.success) {
                sendSuccess(reply, 200, result.data, result.message);
                return;
            }
            sendFailure(reply, 500, result.message, null);
        },

        createUser: async (request, reply) => {
            const body = request.body as { email: string; password: string; name: string; role?: string };
            const role: UserRole = body.role === 'admin' ? 'admin' : 'user';
            const result = await adminService.createUser({ email: body.email, password: body.password, name: body.name, role });
            if (result.success) {
                sendSuccess(reply, 201, result.data, result.message);
                return;
            }
            sendFailure(reply, 400, result.message, null);
        },

        updateUser: async (request, reply) => {
            const { userId } = request.params as { userId: string };
            const body = request.body as { name?: string; role?: string; password?: string };
            const typed = request as FastifyRequest & { user?: AuthUserPayload };

            // Admin cannot change their own role to prevent accidental self-demotion
            if (body.role !== undefined && typed.user?.id === userId) {
                sendFailure(reply, 400, 'Cannot change your own role', null);
                return;
            }

            const updates: { name?: string; role?: UserRole; password?: string } = {};
            if (body.name !== undefined) updates.name = body.name;
            if (body.role === 'admin' || body.role === 'user') updates.role = body.role;
            if (body.password !== undefined) updates.password = body.password;

            const result = await adminService.updateUser(userId, updates);
            if (result.success) {
                sendSuccess(reply, 200, result.data, result.message);
                return;
            }
            sendFailure(reply, 400, result.message, null);
        },

        deactivateUser: async (request, reply) => {
            const { userId } = request.params as { userId: string };
            const typed = request as FastifyRequest & { user?: AuthUserPayload };
            const requestingUserId = typed.user?.id ?? '';
            const result = await adminService.deactivateUser(userId, requestingUserId);
            if (result.success) {
                sendSuccess(reply, 200, null, result.message);
                return;
            }
            sendFailure(reply, 400, result.message, null);
        },
    };

    return handler;
}

export default buildAdminHandler;

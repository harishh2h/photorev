import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import bcrypt from 'bcrypt';
import { normalizeEmail } from '../utils/email';
import { toClientErrorMessage } from '../utils/api-error';
import { UserRole } from '../models/user';

interface AdminUserDto {
    readonly id: string;
    readonly email: string;
    readonly name: string;
    readonly role: string;
    readonly is_active: boolean;
    readonly created_at: string;
}

interface CreateUserParams {
    readonly email: string;
    readonly password: string;
    readonly name: string;
    readonly role: UserRole;
}

interface UpdateUserParams {
    readonly name?: string;
    readonly role?: UserRole;
    readonly password?: string;
}

interface AdminResult<TData> {
    readonly success: boolean;
    readonly data: TData | null;
    readonly message: string;
}

interface AdminServiceMethods {
    listUsers: () => Promise<AdminResult<AdminUserDto[]>>;
    createUser: (params: CreateUserParams) => Promise<AdminResult<AdminUserDto>>;
    updateUser: (userId: string, params: UpdateUserParams) => Promise<AdminResult<AdminUserDto>>;
    deactivateUser: (userId: string, requestingUserId: string) => Promise<AdminResult<null>>;
}

const USER_COLUMNS = ['id', 'email', 'name', 'role', 'is_active', 'created_at'] as const;

function buildAdminService(fastify: FastifyInstance, _opts: FastifyPluginOptions): AdminServiceMethods {
    const service: AdminServiceMethods = {
        listUsers: async () => {
            try {
                const users = await fastify.db('users').select(...USER_COLUMNS).orderBy('created_at', 'desc');
                return { success: true, data: users, message: 'ok' };
            } catch (error) {
                fastify.log.error(error);
                return { success: false, data: null, message: toClientErrorMessage(error, 'Failed to list users') };
            }
        },

        createUser: async (params) => {
            try {
                const emailNormalized = normalizeEmail(params.email);
                const hashedPassword = await bcrypt.hash(params.password, 10);
                const user = await fastify
                    .db('users')
                    .insert(
                        {
                            email: emailNormalized,
                            password_hash: hashedPassword,
                            name: params.name,
                            role: params.role,
                            is_active: true,
                        },
                        [...USER_COLUMNS],
                    )
                    .then((rows: AdminUserDto[]) => rows[0]);
                return { success: true, data: user, message: 'User created' };
            } catch (error: unknown) {
                fastify.log.error(error);
                const pgError = error as { code?: string };
                if (pgError?.code === '23505') {
                    return { success: false, data: null, message: 'Email already in use' };
                }
                return { success: false, data: null, message: toClientErrorMessage(error, 'Failed to create user') };
            }
        },

        updateUser: async (userId, params) => {
            try {
                const updates: Record<string, unknown> = {};
                if (params.name !== undefined) updates.name = params.name;
                if (params.role !== undefined) updates.role = params.role;
                if (params.password !== undefined) {
                    updates.password_hash = await bcrypt.hash(params.password, 10);
                }
                if (Object.keys(updates).length === 0) {
                    const user = await fastify.db('users').where({ id: userId }).select(...USER_COLUMNS).first<AdminUserDto>();
                    if (!user) return { success: false, data: null, message: 'User not found' };
                    return { success: true, data: user, message: 'No changes' };
                }
                const updated = await fastify
                    .db('users')
                    .where({ id: userId })
                    .update(updates, [...USER_COLUMNS])
                    .then((rows: AdminUserDto[]) => rows[0]);
                if (!updated) return { success: false, data: null, message: 'User not found' };
                return { success: true, data: updated, message: 'User updated' };
            } catch (error) {
                fastify.log.error(error);
                return { success: false, data: null, message: toClientErrorMessage(error, 'Failed to update user') };
            }
        },

        deactivateUser: async (userId, requestingUserId) => {
            try {
                if (userId === requestingUserId) {
                    return { success: false, data: null, message: 'Cannot deactivate your own account' };
                }
                const count = await fastify.db('users').where({ id: userId }).update({ is_active: false });
                if (!count) return { success: false, data: null, message: 'User not found' };
                return { success: true, data: null, message: 'User deactivated' };
            } catch (error) {
                fastify.log.error(error);
                return { success: false, data: null, message: toClientErrorMessage(error, 'Failed to deactivate user') };
            }
        },
    };

    return service;
}

export default buildAdminService;

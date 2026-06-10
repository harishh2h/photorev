import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { normalizeEmail } from '../utils/email';
import { toClientErrorMessage } from '../utils/api-error';

interface RegisterUserParams {
    readonly email: string;
    readonly password: string;
    readonly name: string;
}

interface LoginParams {
    readonly email: string;
    readonly password: string;
}

interface SetupParams {
    readonly email: string;
    readonly password: string;
    readonly name: string;
}

interface AuthUserDto {
    readonly id: string;
    readonly email: string;
    readonly name: string;
    readonly role: string | null;
}

interface AuthResult<TData> {
    readonly success: boolean;
    readonly data: TData | null;
    readonly message: string;
    readonly token?: string;
}

export interface AuthConfigDto {
    readonly isInitialized: boolean;
    readonly registrationEnabled: boolean;
}

interface AuthServiceMethods {
    getAuthConfig: () => Promise<AuthConfigDto>;
    adminSignUp: (params: SetupParams) => Promise<AuthResult<AuthUserDto>>;
    registerUser: (params: RegisterUserParams) => Promise<AuthResult<null>>;
    loginUser: (params: LoginParams) => Promise<AuthResult<AuthUserDto>>;
}

function buildAuthService(fastify: FastifyInstance, _opts: FastifyPluginOptions): AuthServiceMethods {
    const signToken = (payload: { id: string; email: string; name: string; role: string | null }): string | null => {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            fastify.log.error('JWT_SECRET is not defined');
            return null;
        }
        return jwt.sign(payload, secret, { expiresIn: '7d' });
    };

    const service: AuthServiceMethods = {
        getAuthConfig: async (): Promise<AuthConfigDto> => {
            const adminUser = await fastify.db('users').where({ role: 'admin' }).first<{ id: string }>();
            return {
                isInitialized: Boolean(adminUser),
                registrationEnabled: process.env.AUTH_PUBLIC_REGISTRATION === 'true',
            };
        },

        adminSignUp: async (params: SetupParams): Promise<AuthResult<AuthUserDto>> => {
            try {
                // Wrap in a transaction so two concurrent requests can't both create an admin
                const result = await fastify.db.transaction(async (trx) => {
                    // Re-check inside transaction to guard against concurrent setup
                    const adminExists = await trx('users').where({ role: 'admin' }).first<{ id: string }>();
                    if (adminExists) {
                        return { alreadyExists: true as const };
                    }
                    const emailNormalized = normalizeEmail(params.email);
                    const hashedPassword = await bcrypt.hash(params.password, 10);
                    const inserted = await trx('users')
                        .insert(
                            {
                                email: emailNormalized,
                                password_hash: hashedPassword,
                                name: params.name,
                                role: 'admin',
                                is_active: true,
                            },
                            ['id', 'email', 'name', 'role'],
                        )
                        .then((rows: { id: string; email: string; name: string; role: string }[]) => rows[0]);
                    return { user: inserted };
                });

                if ('alreadyExists' in result) {
                    return { success: false, data: null, message: 'Setup already completed' };
                }

                const { user } = result as { user: { id: string; email: string; name: string; role: string } };
                const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role });
                if (!token) {
                    return { success: false, data: null, message: 'Failed to create admin account' };
                }
                return {
                    success: true,
                    data: { id: user.id, email: user.email, name: user.name, role: user.role },
                    message: 'Admin account created',
                    token,
                };
            } catch (error) {
                fastify.log.error(error);
                return { success: false, data: null, message: toClientErrorMessage(error, 'Failed to create admin account') };
            }
        },

        registerUser: async (params: RegisterUserParams): Promise<AuthResult<null>> => {
            if (process.env.AUTH_PUBLIC_REGISTRATION !== 'true') {
                return { success: false, data: null, message: 'Registration is disabled' };
            }
            try {
                const emailNormalized = normalizeEmail(params.email);
                const hashedPassword = await bcrypt.hash(params.password, 10);
                await fastify
                    .db('users')
                    .insert(
                        {
                            email: emailNormalized,
                            password_hash: hashedPassword,
                            name: params.name,
                            role: 'user',
                            is_active: true,
                        },
                        ['id'],
                    );
                return { success: true, data: null, message: 'User registered successfully' };
            } catch (error) {
                fastify.log.error(error);
                return { success: false, data: null, message: toClientErrorMessage(error, 'Failed to register user') };
            }
        },

        loginUser: async (params: LoginParams): Promise<AuthResult<AuthUserDto>> => {
            try {
                const emailNormalized = normalizeEmail(params.email);
                const user = await fastify
                    .db('users')
                    .where({ email: emailNormalized })
                    .first<{
                        id: string;
                        email: string;
                        name: string;
                        password_hash: string;
                        role: string | null;
                        is_active: boolean;
                    }>();
                if (!user) {
                    return { success: false, data: null, message: 'Invalid email or password' };
                }
                // Reject deactivated accounts with same generic message to avoid enumeration
                if (user.is_active === false) {
                    return { success: false, data: null, message: 'Invalid email or password' };
                }
                const isMatch = await bcrypt.compare(params.password, user.password_hash);
                if (!isMatch) {
                    return { success: false, data: null, message: 'Invalid email or password' };
                }
                const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role ?? null });
                if (!token) {
                    return { success: false, data: null, message: 'Failed to login user' };
                }
                return {
                    success: true,
                    data: { id: user.id, email: user.email, name: user.name, role: user.role ?? null },
                    message: 'Login successful',
                    token,
                };
            } catch (error) {
                fastify.log.error(error);
                return { success: false, data: null, message: toClientErrorMessage(error, 'Failed to login user') };
            }
        },
    };

    return service;
}

export default buildAuthService;

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

interface RegisterUserParams {
    readonly email: string;
    readonly password: string;
    readonly name: string;
}

interface LoginParams {
    readonly email: string;
    readonly password: string;
}

interface AuthUserDto {
    readonly id: string;
    readonly email: string;
    readonly name: string;
}

interface AuthResult<TData> {
    readonly success: boolean;
    readonly data: TData | null;
    readonly message: string;
    readonly token?: string;
}

interface AuthServiceMethods {
    registerUser: (params: RegisterUserParams) => Promise<AuthResult<AuthUserDto>>;
    loginUser: (params: LoginParams) => Promise<AuthResult<AuthUserDto>>;
}

function buildAuthService(fastify: FastifyInstance, _opts: FastifyPluginOptions): AuthServiceMethods {
    const service: AuthServiceMethods = {
        registerUser: async (params: RegisterUserParams): Promise<AuthResult<AuthUserDto>> => {
            try {
                const hashedPassword = await bcrypt.hash(params.password, 10);
                const inserted = await fastify.db('users')
                    .insert(
                        {
                            email: params.email,
                            password_hash: hashedPassword,
                            name: params.name,
                            role: 'reviewer',
                        },
                        ['id', 'email', 'name'],
                    )
                    .then((rows: { id: string; email: string; name: string }[]) => rows[0]);
                return {
                    success: true,
                    data: { id: inserted.id, email: inserted.email, name: inserted.name },
                    message: 'User registered successfully',
                };
            } catch (error) {
                fastify.log.error(error);
                return { success: false, data: null, message: 'Failed to register user' };
            }
        },
        loginUser: async (params: LoginParams): Promise<AuthResult<AuthUserDto>> => {
            try {
                const user = await fastify
                    .db('users')
                    .where({ email: params.email })
                    .first<{ id: string; email: string; name: string; password_hash: string }>();
                if (!user) {
                    return { success: false, data: null, message: 'Invalid email or password' };
                }
                const isMatch = await bcrypt.compare(params.password, user.password_hash);
                if (!isMatch) {
                    return { success: false, data: null, message: 'Invalid email or password' };
                }
                const secret = process.env.JWT_SECRET;
                if (!secret) {
                    fastify.log.error('JWT_SECRET is not defined');
                    return { success: false, data: null, message: 'Failed to login user' };
                }
                const token = jwt.sign(
                    {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                    },
                    secret,
                    { expiresIn: '7d' },
                );
                return {
                    success: true,
                    data: { id: user.id, email: user.email, name: user.name },
                    message: 'Login successful',
                    token,
                };
            } catch (error) {
                fastify.log.error(error);
                return { success: false, data: null, message: 'Failed to login user' };
            }
        },
    };
    return service;
}

export default buildAuthService
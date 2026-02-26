import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { RegisterSchema } from '../utils/types'
import buildAuthHandler from '../handler/auth.handler'

async function authRoutes(fastify: FastifyInstance, opts: FastifyPluginOptions): Promise<void> {
    const authHandler = buildAuthHandler(fastify, opts)
    fastify.post('/register', { schema: RegisterSchema }, authHandler.registerUser)
}

export default authRoutes
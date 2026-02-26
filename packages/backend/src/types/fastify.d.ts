import type { Knex } from 'knex'

declare module 'fastify' {
  interface FastifyInstance {
    db: Knex
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string
      iat: number
      exp: number
      user: {
        id: string
        email: string
        role: string
      }
    }
  }
}
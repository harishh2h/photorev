interface BuildOptions {
    logger? : boolean | object
}

export const RegisterSchema ={
    body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
        },
        additionalProperties: false
      }
}

export type { BuildOptions }
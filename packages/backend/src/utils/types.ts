interface BuildOptions {
    logger? : boolean | object
}

export const RegisterSchema ={
    body: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email', minLength: 3, maxLength: 255 },
          password: { type: 'string', minLength: 6, maxLength: 255 },
          name: { type: 'string', minLength: 3, maxLength: 255 }
        },
        additionalProperties: false
      }
}

export const LoginSchema = {
    body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
            email: { type: 'string', format: 'email', minLength: 3, maxLength: 255 },
            password: { type: 'string', minLength: 6, maxLength: 255 },
        },
        additionalProperties: false,
    },
}

export type { BuildOptions }
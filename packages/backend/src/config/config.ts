import 'dotenv/config';

interface ServerConfig {
    port : number;
    host : string;
}

interface DatabaseConfig {
    client : string;
    connection : {
        host : string;
        port : number;
        user : string;
        password : string;
        database : string;
    };
}

interface Config {
    server : ServerConfig;
    database : DatabaseConfig;
}
export const config : Config = {

    server : {
        port : Number(process.env.PORT || 3000),
        host : process.env.HOST || '0.0.0.0',
    },
    database : {
        client : process.env.DB_CLIENT || 'pg',
        connection : {
            host : process.env.DB_HOST || 'localhost',
            port : Number(process.env.DB_PORT || 5432),
            user : process.env.DB_USER || 'postgres',
            password : process.env.DB_PASSWORD || 'postgres',
            database : process.env.DB_NAME || 'photorev',
        },
    }
}

const PLACEHOLDER_SECRETS = new Set([
    'change-me-in-production',
    'changeme',
    'secret',
    'your-secret-here',
]);
const MIN_SECRET_LENGTH = 16;

/**
 * Fails fast at boot if security-critical secrets are missing, too short, or left at a known
 * placeholder. Tokens and signed photo URLs are only as strong as JWT_SECRET, so an
 * unconfigured deployment must never start.
 */
export function assertSecurityConfig(): void {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.trim().length === 0) {
        throw new Error('JWT_SECRET is not set. Refusing to start.');
    }
    if (PLACEHOLDER_SECRETS.has(jwtSecret.trim().toLowerCase())) {
        throw new Error('JWT_SECRET is set to an insecure placeholder value. Set a strong, unique secret.');
    }
    if (jwtSecret.trim().length < MIN_SECRET_LENGTH) {
        throw new Error(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters long.`);
    }

    const contentSecret = process.env.CONTENT_SIGNING_SECRET;
    if (contentSecret && contentSecret.trim().length < MIN_SECRET_LENGTH) {
        throw new Error(`CONTENT_SIGNING_SECRET must be at least ${MIN_SECRET_LENGTH} characters long when set.`);
    }
}
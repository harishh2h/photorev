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
import 'dotenv/config';
import buildApp from './app';
import { config } from './config/config';

const server = buildApp({
    logger : {
        level : 'info',
    }
})

const start = async (): Promise<void> => {
    try {
        await server.listen({ port : config.server.port, host : config.server.host });
        server.log.info(`Server is running on http://${config.server.host}:${config.server.port}`);
    } catch (error) {
        server.log.error(error);
        process.exit(1);
    }
}

start();
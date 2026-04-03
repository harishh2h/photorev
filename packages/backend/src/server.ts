import "dotenv/config";
import fs from "fs";
import path from "path";
import buildApp from "./app";
import { config } from "./config/config";
import { initJobSystem } from "./workers";

const server = buildApp({
    logger : {
        level : 'info',
    }
})

const start = async (): Promise<void> => {
    // Check database connection
    try {
        await server.db.raw('SELECT NOW()');
        server.log.info('Database connection OK');
    } catch (error) {
        server.log.error(error, 'Database connection failed');
        process.exit(1);
    }


    try {
        // Create storage directory if it doesn't exist
        const StorageRoot = process.env.STORAGE_ROOT ?? path.join(process.cwd(), 'storage');
        if(!fs.existsSync(StorageRoot)) {
            fs.mkdirSync(StorageRoot, { recursive: true });
            server.log.info(`Created storage directory at ${StorageRoot}`);
        }else{
            server.log.info(`Storage directory already exists at ${StorageRoot}`);
        }

        const photoDir = path.join(StorageRoot, 'photos');
        if(!fs.existsSync(photoDir)) {
            fs.mkdirSync(photoDir, { recursive: true });
            server.log.info(`Created photo directory at ${photoDir}`);
        }else{
            server.log.info(`Photo directory already exists at ${photoDir}`);
        }

    } catch (error) {
        server.log.error(error);
        process.exit(1);
    }

    try {
        await initJobSystem();
        server.log.info("Job system initialized (orphan recovery, queued work, shutdown hooks)");
    } catch (error) {
        server.log.error(error, "Job system initialization failed");
        process.exit(1);
    }

    // Start server
    try {
        await server.listen({ port : config.server.port, host : config.server.host });
        server.log.info(`Server is running on http://${config.server.host}:${config.server.port}`);
    } catch (error) {
        server.log.error(error);
        process.exit(1);
    }
}

start();
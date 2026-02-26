import Fastify, {  FastifyInstance } from "fastify";
import cors from '@fastify/cors';
import { BuildOptions } from "./utils/types";
import routes from "./routes";
import { db } from "./db";
import jwtPlugin from "./plugins/jwt";

function buildApp(opts: BuildOptions = {}) : FastifyInstance {

    const app = Fastify(opts);
    app.register(cors)
    app.register(jwtPlugin);
    app.decorate('db', db);
    app.addHook('onClose', (instance : FastifyInstance, done : () => void) => {
        instance.db.destroy().then(() => done()).catch((err : Error) => {
            instance.log.error(err);
            done();
        });
    })
    app.register(routes)

    return app;
}

export default buildApp;
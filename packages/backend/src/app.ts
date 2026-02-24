import Fastify, {  FastifyInstance } from "fastify";
import cors from '@fastify/cors';
import { BuildOptions } from "./utils/types";
import routes from "./routes";

function buildApp(opts: BuildOptions = {}) : FastifyInstance {

    const app = Fastify(opts);
    app.register(cors)

    app.register(routes)

    return app;
}

export default buildApp;
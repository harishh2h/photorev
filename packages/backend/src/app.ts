import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { BuildOptions } from "./utils/types";
import routes from "./routes";
import { db } from "./db";
import jwtPlugin from "./plugins/jwt";

function buildApp(opts: BuildOptions = {}): FastifyInstance {

  const app = Fastify(opts);
  app.register(cors);
  app.register(jwtPlugin);

  app.register(swagger, {
    openapi: {
      info: {
        title: "PhotoRev API",
        description: "Local-first collaborative photo review API",
        version: "1.0.0",
      },
    },
  });

  app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  });

  app.decorate("db", db);
  app.addHook("onClose", (instance: FastifyInstance, done: () => void) => {
    instance.db
      .destroy()
      .then(() => done())
      .catch((err: Error) => {
        instance.log.error(err);
        done();
      });
  });
  app.register(routes);

  return app;
}

export default buildApp;
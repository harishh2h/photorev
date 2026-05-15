import Fastify, { FastifyError, FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { BuildOptions } from "./utils/types";
import routes from "./routes";
import { db } from "./db";
import jwtPlugin from "./plugins/jwt";
import multipart from "@fastify/multipart";
import { sendFailure } from "./utils/api-response";

const CLIENT_ERROR_MESSAGES: Record<number, string> = {
  400: "Bad request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not found",
  409: "Conflict",
  422: "Invalid input",
  429: "Too many requests",
};

function buildApp(opts: BuildOptions = {}): FastifyInstance {

  const app = Fastify(opts);

  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (reply.sent) {
      return;
    }
    request.log.error(error);
    const rawCode = error.statusCode ?? 500;
    const statusCode = rawCode >= 400 && rawCode < 600 ? rawCode : 500;
    if (error.validation) {
      sendFailure(reply, 400, "Validation failed", { validation: error.validation });
      return;
    }
    if (statusCode >= 500) {
      sendFailure(reply, statusCode, "Something went wrong", null);
      return;
    }
    const message = CLIENT_ERROR_MESSAGES[statusCode] ?? "Request failed";
    sendFailure(reply, statusCode, message, null);
  });

  app.setNotFoundHandler((_request, reply) => {
    sendFailure(reply, 404, "Not found", null);
  });
  app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
  app.register(jwtPlugin);
  app.register(multipart, {
    limits: {
      fileSize: 1024 * 1024 * 30, // 30MB
    },
  });

  app.register(rateLimit, {
    global: false,
  });

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
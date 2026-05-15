import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import fastifyJwt from "@fastify/jwt";
import fp from "fastify-plugin";
import { sendFailure } from "../utils/api-response";

const jwtPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET as string,
    sign: {
      expiresIn: "7d",
    },
  });

  fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (_err) {
      sendFailure(reply, 401, "Unauthorized", null);
      return;
    }
  });
};

export default fp(jwtPlugin);
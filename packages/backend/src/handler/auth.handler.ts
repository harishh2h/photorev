import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import buildAuthService from "../services/auth.service";
import { sendFailure, sendSuccess } from "../utils/api-response";

interface AuthHandlerMethods {
  registerUser: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  loginUser: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}

function buildAuthHandler(fastify: FastifyInstance, _opts: FastifyPluginOptions): AuthHandlerMethods {
  const authService = buildAuthService(fastify, _opts);
  const handler: AuthHandlerMethods = {
    registerUser: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const body = request.body as { email: string; password: string; name: string };
      const result = await authService.registerUser(body);
      if (result.success) {
        sendSuccess(reply, 201, null, result.message);
        return;
      }
      sendFailure(reply, 400, result.message, null);
    },
    loginUser: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const body = request.body as { email: string; password: string };
      const result = await authService.loginUser(body);
      if (!result.success || !result.data || !result.token) {
        sendFailure(reply, 401, result.message, null);
        return;
      }
      sendSuccess(
        reply,
        200,
        {
          token: result.token,
          user: {
            id: result.data.id,
            email: result.data.email,
            name: result.data.name,
          },
        },
        "Signed in",
      );
    },
  };
  return handler;
}

export default buildAuthHandler;

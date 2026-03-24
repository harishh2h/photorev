import { FastifyReply } from "fastify";

export interface ApiEnvelope<T = unknown> {
  error: boolean;
  message: string;
  data: T | null;
}

export function sendSuccess<T>(
  reply: FastifyReply,
  statusCode: number,
  data: T | null,
  message: string,
): void {
  const payload: ApiEnvelope<T> = { error: false, message, data };
  reply.status(statusCode).send(payload);
}

export function sendFailure(
  reply: FastifyReply,
  statusCode: number,
  message: string,
  data: unknown = null,
): void {
  const payload: ApiEnvelope = { error: true, message, data };
  reply.status(statusCode).send(payload);
}

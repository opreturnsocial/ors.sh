import { preHandlerHookHandler } from "fastify";

export const authenticate: preHandlerHookHandler = async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401).send({ message: "Unauthorized: Invalid token" });
  }
};

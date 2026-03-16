import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../db.js";

export async function redirectRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const id = parseInt(request.params.id, 10);

      if (isNaN(id)) {
        return reply.callNotFound();
      }

      const link = await prisma.link.findUnique({ where: { id } });

      if (!link) {
        return reply.callNotFound();
      }

      return reply.redirect(link.url, 302);
    }
  );
}

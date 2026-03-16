import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { authenticate } from "../authenticate.js";
import { prisma } from "../db.js";
import { checkWriteRateLimit } from "../rateLimiter.js";
import { validateUrl } from "../validateUrl.js";

type PatchParams = { Params: { id: string }; Body: { url: string } };
type DeleteParams = { Params: { id: string } };

export async function linkSlugRoutes(fastify: FastifyInstance) {
  fastify.patch<PatchParams>(
    "/:id",
    { preHandler: [authenticate] },
    async (request: FastifyRequest<PatchParams>, reply: FastifyReply) => {
      const rateLimit = checkWriteRateLimit();
      if (!rateLimit.allowed) {
        reply.header(
          "Retry-After",
          Math.ceil(rateLimit.retryAfterMs! / 1000).toString()
        );
        return reply.code(429).send({
          message: "Rate limited",
          retryAfterMs: rateLimit.retryAfterMs,
        });
      }

      const { pubkey } = await request.jwtVerify<{ pubkey: string }>();
      const id = parseInt(request.params.id, 10);

      if (isNaN(id)) {
        return reply.code(400).send({ message: "Invalid id" });
      }

      const link = await prisma.link.findUnique({ where: { id } });
      if (!link) {
        return reply.code(404).send({ message: "Link not found" });
      }

      const user = await prisma.user.findUnique({ where: { pubkey } });
      if (!user || link.userId !== user.id) {
        return reply.code(403).send({ message: "Forbidden" });
      }

      const { url } = request.body;
      if (!url) {
        return reply.code(400).send({ message: "url is required" });
      }

      const urlValidation = validateUrl(url);
      if (!urlValidation.valid) {
        return reply.code(400).send({ message: urlValidation.error });
      }

      const updated = await prisma.link.update({
        where: { id },
        data: { url },
      });

      return reply.send(updated);
    }
  );

  fastify.delete<DeleteParams>(
    "/:id",
    { preHandler: [authenticate] },
    async (request: FastifyRequest<DeleteParams>, reply: FastifyReply) => {
      const rateLimit = checkWriteRateLimit();
      if (!rateLimit.allowed) {
        reply.header(
          "Retry-After",
          Math.ceil(rateLimit.retryAfterMs! / 1000).toString()
        );
        return reply.code(429).send({
          message: "Rate limited",
          retryAfterMs: rateLimit.retryAfterMs,
        });
      }

      const { pubkey } = await request.jwtVerify<{ pubkey: string }>();
      const id = parseInt(request.params.id, 10);

      if (isNaN(id)) {
        return reply.code(400).send({ message: "Invalid id" });
      }

      const link = await prisma.link.findUnique({ where: { id } });
      if (!link) {
        return reply.code(404).send({ message: "Link not found" });
      }

      const user = await prisma.user.findUnique({ where: { pubkey } });
      if (!user || link.userId !== user.id) {
        return reply.code(403).send({ message: "Forbidden" });
      }

      await prisma.link.delete({ where: { id } });
      return reply.code(204).send();
    }
  );
}

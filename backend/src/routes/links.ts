import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { authenticate } from "../authenticate.js";
import { prisma } from "../db.js";
import { checkWriteRateLimit } from "../rateLimiter.js";
import { validateUrl } from "../validateUrl.js";

type CreateBody = { Body: { url: string } };

export async function linksRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { pubkey } = await request.jwtVerify<{ pubkey: string }>();

      const user = await prisma.user.findUnique({ where: { pubkey } });
      if (!user) {
        return reply.code(404).send({ message: "User not found" });
      }

      const links = await prisma.link.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });

      return reply.send(links);
    }
  );

  fastify.post<CreateBody>(
    "/",
    { preHandler: [authenticate] },
    async (request: FastifyRequest<CreateBody>, reply: FastifyReply) => {
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
      const { url } = request.body;

      if (!url) {
        return reply.code(400).send({ message: "url is required" });
      }

      const urlValidation = validateUrl(url);
      if (!urlValidation.valid) {
        return reply.code(400).send({ message: urlValidation.error });
      }

      const user = await prisma.user.findUnique({ where: { pubkey } });
      if (!user) {
        return reply.code(404).send({ message: "User not found" });
      }

      const link = await prisma.link.create({
        data: { url, userId: user.id },
      });

      return reply.code(201).send(link);
    }
  );
}

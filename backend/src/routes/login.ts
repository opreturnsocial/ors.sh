import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../db.js";
import { validateNip98Event } from "../nostr.js";

interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export async function loginRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/login",
    async (
      request: FastifyRequest<{ Body: NostrEvent }>,
      reply: FastifyReply
    ) => {
      const event = request.body;

      if (!event) {
        return reply.code(400).send({ message: "No body provided" });
      }

      const baseUrl = process.env.BASE_URL;
      if (!baseUrl) {
        return reply.code(500).send({ message: "BASE_URL not configured" });
      }

      const { valid, error } = validateNip98Event(event, baseUrl);
      if (!valid) {
        return reply.code(400).send({ message: error });
      }

      try {
        await prisma.user.upsert({
          create: { pubkey: event.pubkey },
          update: {},
          where: { pubkey: event.pubkey },
        });

        const token = fastify.jwt.sign({ pubkey: event.pubkey });
        fastify.log.info({ pubkey: event.pubkey }, "User logged in");
        return reply.send({ token });
      } catch (err) {
        fastify.log.error(err, "Error during login");
        return reply.code(500).send({ message: "Internal server error" });
      }
    }
  );
}

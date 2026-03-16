import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import staticFiles from "@fastify/static";
import Fastify from "fastify";
import path from "path";
import { fileURLToPath } from "url";
import { linksRoutes } from "./routes/links.js";
import { linkSlugRoutes } from "./routes/linkSlug.js";
import { loginRoutes } from "./routes/login.js";
import { redirectRoutes } from "./routes/redirect.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors, {
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
  });

  app.register(jwt, {
    secret: process.env.JWT_SECRET || "fallback-secret-change-me",
  });

  // Redirect route MUST be registered before static files
  app.register(redirectRoutes);

  // API routes
  app.register(loginRoutes, { prefix: "/api/users" });
  app.register(linksRoutes, { prefix: "/api/links" });
  app.register(linkSlugRoutes, { prefix: "/api/links" });

  // Serve frontend static files
  const frontendDist = path.join(__dirname, "../../frontend/dist");
  app.register(staticFiles, {
    root: frontendDist,
    prefix: "/",
    decorateReply: false,
  });

  // SPA fallback
  app.setNotFoundHandler((_request, reply) => {
    reply.sendFile("index.html", frontendDist);
  });

  return app;
}

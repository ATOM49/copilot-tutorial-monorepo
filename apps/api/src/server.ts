import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

loadEnv({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env"),
});

import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { authContextCookiePlugin } from "./plugins/authContext.cookie";
import { copilotDemoRoutes } from "./routes/copilotDemo";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: "http://localhost:3000",
  credentials: true,
});

await app.register(cookie); // enables req.cookies
await app.register(authContextCookiePlugin);

app.get("/health", async (req) => {
  return {
    ok: true as const,
    service: "api",
    ts: new Date().toISOString(),
    auth: req.auth,
  };
});

await app.register(copilotDemoRoutes);

await app.listen({ port: 3001, host: "0.0.0.0" });

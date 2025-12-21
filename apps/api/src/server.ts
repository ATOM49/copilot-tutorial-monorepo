import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

loadEnv({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env.local"),
});

import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { authContextCookiePlugin } from "./plugins/authContext.cookie.js";
import { errorHandler } from "./plugins/errorHandler.js";
import { copilotDemoRoutes } from "./routes/copilotDemo.js";
import { copilotAgentRoutes } from "./routes/copilotAgent.js";

// Create Fastify instance with Zod type provider
const app = Fastify({ 
  logger: true,
  // Add request timeout (60 seconds)
  connectionTimeout: 60_000,
  keepAliveTimeout: 65_000,
}).withTypeProvider<ZodTypeProvider>();

// Set Zod as the default validator and serializer
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

await app.register(cors, {
  origin: "http://localhost:3000",
  credentials: true,
});

await app.register(cookie); // enables req.cookies
await app.register(authContextCookiePlugin);
await app.register(errorHandler); // Global error handling

app.get("/health", async (req) => {
  return {
    ok: true as const,
    service: "api",
    ts: new Date().toISOString(),
    auth: req.auth,
  };
});

await app.register(copilotDemoRoutes);
await app.register(copilotAgentRoutes);

await app.listen({ port: 3001, host: "0.0.0.0" });

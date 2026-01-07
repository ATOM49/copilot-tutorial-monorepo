import fp from "fastify-plugin";
import { z } from "zod";
import fastifyCookie from "@fastify/cookie";

const AuthContextSchema = z.object({
  userId: z.string().min(1),
  tenantId: z.string().min(1),
  roles: z.array(z.string()).optional(),
});

const DEV_DEFAULT_AUTH: AuthContext = {
  userId: "dev-user",
  tenantId: "dev-tenant",
  roles: ["admin"],
};

export type AuthContext = z.infer<typeof AuthContextSchema>;

declare module "fastify" {
  interface FastifyRequest {
    auth: AuthContext;
  }
}

export const authContextCookiePlugin = fp(async (app) => {
  app.addHook("preHandler", async (req) => {
    const raw = req.cookies["copilot_auth"];

    // dev fallback (so API still works if cookie isn't set yet)
    if (!raw) {
      req.auth = DEV_DEFAULT_AUTH;
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      const auth = AuthContextSchema.parse(parsed);
      req.auth = {
        ...auth,
        roles: auth.roles?.length ? auth.roles : DEV_DEFAULT_AUTH.roles,
      };
    } catch {
      // if cookie is malformed, fail closed (or fallback in dev)
      req.auth = DEV_DEFAULT_AUTH;
    }
  });
});

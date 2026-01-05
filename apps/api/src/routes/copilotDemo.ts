import type { FastifyPluginAsync } from "fastify";
import {
  createOpenAIChatModel,
  copilotSystemPrompt,
  runStructured,
} from "@copilot/ai-core";
import { DemoOutputSchema } from "@copilot/shared";
import { z } from "zod/v3";

export const copilotDemoRoutes: FastifyPluginAsync = async (app) => {
  app.post("/copilot/demo", async (req) => {
    const Body = z.object({ input: z.string().min(1) });
    const { input } = Body.parse(req.body);

    const model = createOpenAIChatModel({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      apiKey: process.env.OPENAI_API_KEY,
    });

    const system = copilotSystemPrompt({ appName: "Copilot Web" });
    const result = await runStructured({
      model,
      system,
      input,
      schema: DemoOutputSchema,
    });

    return { ok: true as const, result };
  });
};

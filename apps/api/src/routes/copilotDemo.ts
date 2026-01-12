import type { FastifyPluginAsync } from "fastify";
import { createOpenAIChatModel, HumanMessage, runStructured, SystemMessage } from "@copilot/ai-core";

import { DemoOutputSchema } from "@copilot/shared";
import { z } from "zod";

export const copilotDemoRoutes: FastifyPluginAsync = async (app) => {
  app.post("/copilot/demo", async (req) => {
    const Body = z.object({ input: z.string().min(1) });
    const { input } = Body.parse(req.body);

    const model = createOpenAIChatModel({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      apiKey: process.env.OPENAI_API_KEY,
    });

    const messages = [
      new SystemMessage(
        "You are a helpful Copilot demo. Return structured JSON that matches the provided schema."
      ),
      new HumanMessage(input),
    ];

    const result = await runStructured({
      model,
      schema: DemoOutputSchema,
      messages,
    });

    return { ok: true as const, result };
  });
};

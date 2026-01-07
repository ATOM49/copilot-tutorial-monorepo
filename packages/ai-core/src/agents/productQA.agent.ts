import type { BaseMessage } from "@langchain/core/messages";
import { z } from "zod/v3";
import type { AgentDefinition, AgentContext } from "./AgentDefinition.js";
import {
  createAgentModel,
  withDefaultAgentContext,
  runWithResolvedTools,
} from "./agentUtils.js";
import { runStructured } from "../runners/runStructured.js";

/**
 * Input schema for Product Q&A agent
 */
export const ProductQAInputSchema = z.object({
  question: z.string().min(1, "Question is required"),
  productContext: z.string().optional(),
});

/**
 * Output schema for Product Q&A agent
 */
export const ProductQAOutputSchema = z.object({
  answer: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
  sources: z.array(z.string()).optional().default([]).nullable(),
  suggestedFollowUps: z.array(z.string()).optional().default([]).nullable(),
});

export type ProductQAInput = z.infer<typeof ProductQAInputSchema>;
export type ProductQAOutput = z.infer<typeof ProductQAOutputSchema>;

const AGENT_ID = "product-qa";
/**
 * Product Q&A Agent
 * Answers questions about products using structured JSON output
 */
export const productQAAgent: AgentDefinition<
  typeof ProductQAInputSchema,
  typeof ProductQAOutputSchema
> = {
  id: AGENT_ID,
  name: "Product Q&A",
  inputSchema: ProductQAInputSchema,
  outputSchema: ProductQAOutputSchema,

  run: async (
    input: ProductQAInput,
    context?: AgentContext
  ): Promise<ProductQAOutput> => {
    const baseModel = createAgentModel({ temperature: 0 });

    const toolContext = withDefaultAgentContext(AGENT_ID, context);
    const signal = toolContext.signal;

    const systemSections = [
      "You are a Product Q&A copilot.",
      "Use tools when needed. If a tool is not necessary, answer directly.",
      "Do not invent tool results.",
      input.productContext ? `Product Context:\n${input.productContext}` : "",
      context ? `User: ${context.userId} | Tenant: ${context.tenantId}` : "",
    ].filter(Boolean);

    const system = systemSections.join("\n\n");
    const conversation: BaseMessage[] = await runWithResolvedTools({
      agentId: AGENT_ID,
      model: baseModel,
      system,
      userInput: input.question,
      context: toolContext,
    });

    const structuredMessages: BaseMessage[] = [...conversation];

    const final = await runStructured({
      model: baseModel,
      schema: ProductQAOutputSchema as any,
      messages: structuredMessages,
      strict: false,
      signal,
    });

    return final;
  },
};

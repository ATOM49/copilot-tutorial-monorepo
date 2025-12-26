import { z } from "zod/v3";
import type { AgentDefinition, AgentContext } from "./AgentDefinition.js";
import { createOpenAIChatModel } from "../providers/openai.js";
import { runStructured } from "../runners/runStructured.js";
import { copilotSystemPrompt } from "../prompts/copilotPrompts.js";

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
  sources: z.array(z.string()).default([]),
  suggestedFollowUps: z.array(z.string()).default([]),
});

export type ProductQAInput = z.infer<typeof ProductQAInputSchema>;
export type ProductQAOutput = z.infer<typeof ProductQAOutputSchema>;

/**
 * Product Q&A Agent
 * Answers questions about products using structured JSON output
 */
export const productQAAgent: AgentDefinition<
  typeof ProductQAInputSchema,
  typeof ProductQAOutputSchema
> = {
    id: "product-qa",
    name: "Product Q&A",
    inputSchema: ProductQAInputSchema,
    outputSchema: ProductQAOutputSchema,

    async run(
      input: ProductQAInput,
      context?: AgentContext
    ): Promise<ProductQAOutput> {
      const model = createOpenAIChatModel({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      });

      // Build custom system prompt for this agent
      const basePrompt = copilotSystemPrompt({ appName: "Product Q&A Agent" });
      const systemPrompt = [
        basePrompt,
        "You are a helpful product assistant that answers questions about products.",
        input.productContext
          ? `\nProduct Context:\n${input.productContext}`
          : "",
        "\nProvide accurate, helpful answers with a confidence level.",
        "If you're not sure, indicate lower confidence and suggest follow-up questions.",
        context
          ? `\nUser: ${context.userId} | Tenant: ${context.tenantId}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");

      const result = await runStructured({
        model,
        system: systemPrompt,
        input: input.question,
        schema: ProductQAOutputSchema,
        strict: false,
        signal: context?.signal, // Pass abort signal if available
      });

      return result;
    },
  };

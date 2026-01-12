import { z } from "zod";
import type { AgentContext } from "./AgentDefinition.js";
import { BaseAgent } from "./BaseAgent.js";

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

class ProductQAAgent extends BaseAgent<
  typeof ProductQAInputSchema,
  typeof ProductQAOutputSchema
> {
  constructor() {
    super({
      id: AGENT_ID,
      name: "Product Q&A",
      inputSchema: ProductQAInputSchema,
      outputSchema: ProductQAOutputSchema,
    });
  }

  protected shouldUseToolLoop(): boolean {
    return true;
  }

  protected getModelOptions() {
    return { temperature: 0 };
  }

  protected buildSystemPrompt(input: ProductQAInput, context: AgentContext) {
    const systemSections = [
      "You are a Product Q&A copilot.",
      "Use tools when needed. If a tool is not necessary, answer directly.",
      "Do not invent tool results.",
      input.productContext ? `Product Context:\n${input.productContext}` : "",
      context ? `User: ${context.userId} | Tenant: ${context.tenantId}` : "",
    ].filter(Boolean);

    return systemSections.join("\n\n");
  }

  protected buildUserInput(input: ProductQAInput): string {
    return input.question;
  }
}

export const productQAAgent = new ProductQAAgent();

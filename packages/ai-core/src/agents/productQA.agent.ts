import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";
import { z } from "zod/v3";
import type { AgentDefinition, AgentContext } from "./AgentDefinition.js";
import { createOpenAIChatModel } from "../providers/openai.js";
import { toolDefsToLangChainTools } from "../tools/registryToLangChainTools.js";
import { runToolCallingLoop } from "../runners/runToolLoop.js";
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

const DEFAULT_CONTEXT: AgentContext = {
  userId: "system",
  tenantId: "system",
  tools: [],
};
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
    const baseModel = createOpenAIChatModel({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0,
    });

    const toolContext: AgentContext = {
      ...DEFAULT_CONTEXT,
      ...context,
    };
    const signal = toolContext.signal;

    const systemSections = [
      "You are a Product Q&A copilot.",
      "Use tools when needed. If a tool is not necessary, answer directly.",
      "Do not invent tool results.",
      input.productContext ? `Product Context:\n${input.productContext}` : "",
      context ? `User: ${context.userId} | Tenant: ${context.tenantId}` : "",
    ].filter(Boolean);

    const system = systemSections.join("\n\n");

    const allowedTools = toolContext.tools ?? [];
    const fallbackTools = toolContext.toolRegistry?.getToolsForAgent(AGENT_ID, {
      fallbackToAll: true,
    });
    const toolDefs = allowedTools.length
      ? allowedTools
      : fallbackTools ?? toolContext.toolRegistry?.list() ?? [];

    let conversation: BaseMessage[];

    if (toolDefs.length) {
      const { tools, toolsByName } = toolDefsToLangChainTools(
        toolDefs,
        toolContext
      );
      const modelWithTools = baseModel.bindTools(tools);

      conversation = await runToolCallingLoop({
        modelWithTools,
        toolsByName,
        system,
        userInput: input.question,
        signal,
        emit: toolContext.emit,
        maxSteps: 6,
      });
    } else {
      const systemMessage = new SystemMessage(system);
      const userMessage = new HumanMessage(input.question);
      const aiResponse = await baseModel.invoke([systemMessage, userMessage], {
        signal,
      });
      conversation = [systemMessage, userMessage, aiResponse];
    }

    const structuredMessages: BaseMessage[] = [
      ...conversation,
      // new HumanMessage(
      //   "Return the final answer as JSON matching the schema exactly."
      // ),
    ];

    const final = await runStructured({
      model: baseModel,
      schema: ProductQAOutputSchema as any,
      messages: structuredMessages,
      strict: false,
      signal,
    });

    toolContext.emit?.({ type: "status", status: "done" });

    return final;
  },
};

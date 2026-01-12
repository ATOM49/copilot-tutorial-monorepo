import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";
import type { AgentContext } from "./AgentDefinition.js";
import type { ToolDefinition } from "../tools/ToolDefinition.js";
import { toolDefsToLangChainTools } from "../tools/registryToLangChainTools.js";
import { runToolCallingLoop } from "../runners/runToolLoop.js";
import { createOpenAIChatModel } from "../providers/openai.js";

export type AgentModelOptions = {
  temperature?: number;
  model?: string;
};

export function withDefaultAgentContext(
  agentId: string,
  context?: AgentContext,
  overrides?: Partial<AgentContext>
): AgentContext {
  const base: AgentContext = {
    userId: "system",
    tenantId: "system",
    tools: [],
    agentId,
    ...overrides,
  };

  const merged: AgentContext = {
    ...base,
    ...context,
  };

  merged.agentId = merged.agentId ?? agentId;
  return merged;
}

export function createAgentModel(options: AgentModelOptions = {}) {
  const { temperature = 0, model = process.env.OPENAI_MODEL ?? "gpt-4o-mini" } =
    options;

  return createOpenAIChatModel({
    model,
    temperature,
  });
}

export function resolveToolsForAgent(
  agentId: string,
  context: AgentContext
): ToolDefinition[] {
  const allowedTools = context.tools;
  const fallbackTools =
    allowedTools === undefined
      ? context.toolRegistry?.getToolsForAgent(agentId, { fallbackToAll: true })
      : undefined;

  return allowedTools !== undefined
    ? allowedTools
    : fallbackTools ?? context.toolRegistry?.list() ?? [];
}

export async function runWithResolvedTools(args: {
  agentId: string;
  model: any;
  system: string;
  userInput: string;
  context: AgentContext;
  maxSteps?: number;
  toolTimeoutMs?: number;
}): Promise<BaseMessage[]> {
  const { agentId, model, system, userInput, context } = args;
  const toolDefs = resolveToolsForAgent(agentId, context);

  if (toolDefs.length) {
    const { tools, toolsByName, toolDefsByName } = toolDefsToLangChainTools(
      toolDefs,
      context
    );
    const modelWithTools = model.bindTools(tools);
    console.log({ emit: context.emit });
    return runToolCallingLoop({
      modelWithTools,
      toolsByName,
      toolDefsByName,
      system,
      userInput,
      signal: context.signal,
      emit: context.emit,
      maxSteps: args.maxSteps ?? 6,
      toolTimeoutMs: args.toolTimeoutMs,
    });
  }

  const systemMessage = new SystemMessage(system);
  const userMessage = new HumanMessage(userInput);
  const aiResponse = await model.invoke([systemMessage, userMessage], {
    signal: context.signal,
  });
  return [systemMessage, userMessage, aiResponse];
}

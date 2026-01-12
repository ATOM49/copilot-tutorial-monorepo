import { z } from "zod";
import type { BaseMessage } from "@langchain/core/messages";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { AgentDefinition, AgentContext } from "./AgentDefinition.js";
import {
  withDefaultAgentContext,
  createAgentModel,
  runWithResolvedTools,
  type AgentModelOptions,
} from "./agentUtils.js";
import { runStructured } from "../runners/runStructured.js";

type ToolLoopConfig = {
  maxSteps?: number;
  toolTimeoutMs?: number;
};

interface BaseAgentConfig<
  TInputSchema extends z.ZodTypeAny,
  TOutputSchema extends z.ZodTypeAny
> {
  id: string;
  name: string;
  inputSchema: TInputSchema;
  outputSchema: TOutputSchema;
}

type AgentRunArgs<TInputSchema extends z.ZodTypeAny> = {
  input: z.infer<TInputSchema>;
  context: AgentContext;
  model: any;
  messages: BaseMessage[];
};

export abstract class BaseAgent<
  TInputSchema extends z.ZodTypeAny,
  TOutputSchema extends z.ZodTypeAny
> implements AgentDefinition<TInputSchema, TOutputSchema> {
  readonly id: string;
  readonly name: string;
  readonly inputSchema: TInputSchema;
  readonly outputSchema: TOutputSchema;

  protected constructor(config: BaseAgentConfig<TInputSchema, TOutputSchema>) {
    this.id = config.id;
    this.name = config.name;
    this.inputSchema = config.inputSchema;
    this.outputSchema = config.outputSchema;
  }

  async run(
    input: z.infer<TInputSchema>,
    context?: AgentContext
  ): Promise<z.infer<TOutputSchema>> {
    const agentContext = withDefaultAgentContext(this.id, context);
    const model = createAgentModel(
      this.getModelOptions(input, agentContext)
    );

    if (this.shouldUseToolLoop(input, agentContext)) {
      const system = this.buildSystemPrompt(input, agentContext);
      const userInput = this.buildUserInput(input, agentContext);
      const conversation = await runWithResolvedTools({
        agentId: this.id,
        model,
        system,
        userInput,
        context: agentContext,
        ...this.getToolLoopConfig(input, agentContext),
      });
      return this.handleMessages(
        {
          input,
          context: agentContext,
          model,
          messages: conversation,
        },
        "tool"
      );
    }

    const messages = this.buildPromptMessages(input, agentContext);
    return this.handleMessages({
      input,
      context: agentContext,
      model,
      messages,
    }, "prompt");
  }

  /** Override to customize the core system prompt per agent */
  protected abstract buildSystemPrompt(
    input: z.infer<TInputSchema>,
    context: AgentContext
  ): string;

  /** Override to control the user input passed into the model/tool loop */
  protected abstract buildUserInput(
    input: z.infer<TInputSchema>,
    context: AgentContext
  ): string;

  /** Whether this agent should run the LangChain tool loop */
  protected shouldUseToolLoop(
    _input: z.infer<TInputSchema>,
    _context: AgentContext
  ): boolean {
    return false;
  }

  /** Additional options for the shared model */
  protected getModelOptions(
    _input: z.infer<TInputSchema>,
    _context: AgentContext
  ): AgentModelOptions {
    return {};
  }

  /** Tool loop controls (max steps, timeouts, etc.) */
  protected getToolLoopConfig(
    _input: z.infer<TInputSchema>,
    _context: AgentContext
  ): ToolLoopConfig {
    return {};
  }

  /** Override to change strictness for structured extraction */
  protected getStructuredStrict(
    _input: z.infer<TInputSchema>,
    _context: AgentContext
  ): boolean {
    return false;
  }

  /** Default prompt builder (system + user message) */
  protected buildPromptMessages(
    input: z.infer<TInputSchema>,
    context: AgentContext
  ): BaseMessage[] {
    return [
      new SystemMessage(this.buildSystemPrompt(input, context)),
      new HumanMessage(this.buildUserInput(input, context)),
    ];
  }

  /** Unified handler for both tool-loop and prompt-only executions */
  protected async handleMessages(
    args: AgentRunArgs<TInputSchema>,
    _source: "tool" | "prompt"
  ): Promise<z.infer<TOutputSchema>> {
    return this.runStructuredExtraction({
      schema: this.outputSchema,
      messages: args.messages,
      model: args.model,
      context: args.context,
      input: args.input,
    });
  }

  protected runStructuredExtraction<TSchema extends z.ZodTypeAny>(args: {
    schema: TSchema;
    messages: BaseMessage[];
    model: any;
    context: AgentContext;
    input: z.infer<TInputSchema>;
    strict?: boolean;
  }): Promise<z.infer<TSchema>> {
    const strict =
      args.strict ?? this.getStructuredStrict(args.input, args.context);

    return runStructured({
      model: args.model,
      schema: args.schema,
      messages: args.messages,
      strict,
      signal: args.context.signal,
    });
  }
}

import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { AgentContext } from "./AgentDefinition.js";
import { BaseAgent } from "./BaseAgent.js";
import {
  ActionHelperOutputSchema,
  type ActionHelperOutput,
  type ProposedAction,
} from "@copilot/shared";

const AGENT_ID = "ticket-handler";

const TicketHandlerInputSchema = z.object({
  request: z.string().min(1, "Request is required"),
  context: z.string().optional(),
  urgency: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

export type TicketHandlerInput = z.infer<typeof TicketHandlerInputSchema>;
export type TicketHandlerOutput = ActionHelperOutput;

function ensureActionIds(actions: ProposedAction[]): ProposedAction[] {
  return actions.map((action, index) => {
    if (action.actionId && action.actionId.length >= 6) {
      return action;
    }

    return {
      ...action,
      actionId: `action-${randomUUID().slice(0, 8)}`,
    };
  });
}

class TicketHandlerAgent extends BaseAgent<
  typeof TicketHandlerInputSchema,
  typeof ActionHelperOutputSchema
> {
  constructor() {
    super({
      id: AGENT_ID,
      name: "Ticket Handler",
      inputSchema: TicketHandlerInputSchema,
      outputSchema: ActionHelperOutputSchema,
    });
  }


  protected getModelOptions() {
    return { temperature: 0 };
  }

  protected buildSystemPrompt(): string {
    return [
      "You are the Ticket Handler action helper agent.",
      "You propose safe write actions but NEVER execute them yourself.",
      "Every response must:",
      "- Include a short summary of the situation",
      "- Provide nextSteps that the user can perform without tools",
      "- Populate proposedActions with machine-readable intents, using the create-ticket tool when relevant",
      "Rules:",
      "1. Do not fabricate tool results or claim that a ticket has already been created.",
      "2. Every proposed action must set requiresConfirmation = true.",
      "3. args must include the best-effort payload for the referenced tool (title, description, priority, tags, requester).",
      "4. Use risk to describe blast radius if the action is executed incorrectly.",
      "5. If there is not enough information to safely act, return an empty proposedActions array and add clarification steps to nextSteps.",
    ].join("\n");
  }

  protected buildUserInput(
    input: TicketHandlerInput,
    context: AgentContext
  ): string {
    console.log("buildUserInput", { input });
    return [
      `User request:\n${input.request}`,
      input.context ? `Additional context:\n${input.context}` : undefined,
      `Urgency: ${input.urgency}`,
      `Tenant: ${context.tenantId}`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }
  protected shouldUseToolLoop(
    _input: {
      request: string;
      urgency: "low" | "medium" | "high" | "urgent";
      context?: string | undefined;
    },
    _context: AgentContext
  ): boolean {
    return true;
  }

  protected async handleMessages(
    args: {
      messages: any;
      context: AgentContext;
      model: any;
      input: TicketHandlerInput;
    },
    _source: "tool" | "prompt"
  ): Promise<TicketHandlerOutput> {
    const plan = await this.runStructuredExtraction({
      schema: ActionHelperOutputSchema,
      messages: args.messages,
      model: args.model,
      context: args.context,
      input: args.input,
      strict: false,
    });

    console.log({ proposedActions: plan.proposedActions });
    return {
      ...plan,
      proposedActions: ensureActionIds(plan.proposedActions ?? []),
    };
  }
}

export const ticketHandlerAgent = new TicketHandlerAgent();

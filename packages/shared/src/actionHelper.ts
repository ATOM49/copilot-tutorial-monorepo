import { z } from "zod";

const ActionArgValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const ActionRiskSchema = z.enum(["low", "medium", "high"]);

export type ActionRisk = z.infer<typeof ActionRiskSchema>;

export const ProposedActionSchema = z.object({
  actionId: z
    .string()
    .min(6, "actionId must be at least 6 characters")
    .describe("Unique identifier used to track this proposed action."),
  toolId: z
    .string()
    .min(1, "toolId is required")
    .describe(
      "Identifier of the tool to execute once confirmed (e.g., create-ticket)."
    ),
  args: z
    .object({})
    .catchall(ActionArgValueSchema)
    .default({})
    .describe("Arguments to supply to the tool if the action is confirmed."),
  title: z
    .string()
    .min(1, "title is required")
    .describe("Short UI label that explains the action."),
  risk: ActionRiskSchema.describe(
    "Relative risk of running the action without human review."
  ),
  requiresConfirmation: z
    .literal(true)
    .describe("Write actions must always be confirmed before execution."),
  preview: z
    .string()
    .min(1, "preview is required")
    .describe("Human-readable summary of what the tool will do when executed."),
});

export type ProposedAction = z.infer<typeof ProposedActionSchema>;

export const ActionHelperOutputSchema = z.object({
  summary: z
    .string()
    .min(1, "summary is required")
    .describe(
      "Concise natural-language explanation of the agent's recommendation."
    ),
  nextSteps: z
    .array(z.string().min(1))
    .default([])
    .describe("Non-tool actions the user can perform immediately."),
  proposedActions: z
    .array(ProposedActionSchema)
    .default([])
    .describe(
      "Write actions that require explicit confirmation before execution."
    ),
});

export type ActionHelperOutput = z.infer<typeof ActionHelperOutputSchema>;

export const ConfirmPendingActionRequestSchema = z.object({
  actionId: z.string().min(6, "actionId is required"),
});

export const ConfirmPendingActionResponseSchema = z.object({
  ok: z.literal(true),
  actionId: z.string().min(6),
  status: z.literal("executed"),
  result: z.unknown().optional(),
  executedAt: z.string().optional(),
});

export type ConfirmPendingActionRequest = z.infer<
  typeof ConfirmPendingActionRequestSchema
>;
export type ConfirmPendingActionResponse = z.infer<
  typeof ConfirmPendingActionResponseSchema
>;

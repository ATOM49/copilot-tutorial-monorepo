import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { ToolDefinition, ToolContext } from "./ToolDefinition.js";

export const CreateTicketInputSchema = z.object({
  title: z.string().min(1, "title is required"),
  description: z
    .string()
    .min(1, "description is required")
    .describe("Detailed summary of the user request."),
  priority: z
    .enum(["low", "medium", "high", "urgent"])
    .default("medium")
    .describe("Relative urgency so downstream workflows can triage."),
  tags: z
    .array(z.string().min(1))
    .default([])
    .describe("Optional tags that help categorize the ticket."),
  requester: z.string().optional(),
});

export const CreateTicketOutputSchema = z.object({
  ticketId: z.string(),
  status: z.literal("created"),
  createdAt: z.string(),
  preview: z.string(),
});

export type CreateTicketInput = z.infer<typeof CreateTicketInputSchema>;
export type CreateTicketOutput = z.infer<typeof CreateTicketOutputSchema>;

export const createTicketTool: ToolDefinition<
  typeof CreateTicketInputSchema,
  typeof CreateTicketOutputSchema
> = {
  id: "create-ticket",
  name: "Create Ticket",
  description: "Creates a placeholder ticket and returns its id.",
  effect: "write",
  requiresConfirmation: true,
  inputSchema: CreateTicketInputSchema,
  permissions: {
    requiredRoles: ["admin"],
    allowedTenants: ["dev-tenant"],
  },
  async run(
    input: CreateTicketInput,
    _context: ToolContext
  ): Promise<CreateTicketOutput> {
    const ticketId = `TICKET-${randomUUID().slice(0, 8).toUpperCase()}`;
    const createdAt = new Date().toISOString();

    return {
      ticketId,
      status: "created",
      createdAt,
      preview: `Ticket "${input.title}" captured with ${input.priority} priority (${ticketId}).`,
    };
  },
};

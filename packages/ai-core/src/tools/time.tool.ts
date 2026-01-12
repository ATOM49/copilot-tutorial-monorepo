import { z } from "zod";
import type { ToolDefinition, ToolContext } from "./ToolDefinition.js";

/**
 * Input schema for time tool
 */
export const TimeInputSchema = z.object({
  timezone: z.string().optional().default("UTC"),
});

/**
 * Output schema for time tool
 */
export const TimeOutputSchema = z.object({
  currentTime: z.string(),
  timezone: z.string(),
  timestamp: z.number(),
});

export type TimeInput = z.infer<typeof TimeInputSchema>;
export type TimeOutput = z.infer<typeof TimeOutputSchema>;

/**
 * Time Tool
 * Returns the current time in the specified timezone
 */
export const timeTool: ToolDefinition<
  typeof TimeInputSchema,
  typeof TimeOutputSchema
> = {
  id: "time",
  name: "Current Time",
  inputSchema: TimeInputSchema,
  permissions: {
    requiredRoles: ["admin"],
    allowedTenants: ["dev-tenant"],
  },

  async run(
    input: TimeInput,
    _context: ToolContext
  ): Promise<TimeOutput> {
    const now = new Date();
    const timestamp = now.getTime();

    // For simplicity, return ISO string (in real implementation, would format per timezone)
    const currentTime = now.toISOString();

    return {
      currentTime,
      timezone: input.timezone,
      timestamp,
    };
  },
};

import { z } from "zod";

/**
 * Tool metadata for UI display
 */
export const ToolMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type ToolMetadata = z.infer<typeof ToolMetadataSchema>;

/**
 * Response from GET /copilot/tools (list all tools)
 */
export const ListToolsResponseSchema = z.object({
  tools: z.array(ToolMetadataSchema),
});

export type ListToolsResponse = z.infer<typeof ListToolsResponseSchema>;

/**
 * Request to set allowlist for an agent
 */
export const SetToolAllowlistRequestSchema = z.object({
  agentId: z.string(),
  toolIds: z.array(z.string()),
});

export type SetToolAllowlistRequest = z.infer<
  typeof SetToolAllowlistRequestSchema
>;

/**
 * Response from GET /copilot/agents/:agentId/tools
 */
export const GetAgentToolsResponseSchema = z.object({
  agentId: z.string(),
  allowedTools: z.array(ToolMetadataSchema),
  availableTools: z.array(ToolMetadataSchema),
});

export type GetAgentToolsResponse = z.infer<typeof GetAgentToolsResponseSchema>;

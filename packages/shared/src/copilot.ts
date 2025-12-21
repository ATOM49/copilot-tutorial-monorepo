import { z } from "zod";

/**
 * Request schema for running an agent
 */
export const RunAgentRequestSchema = z.object({
  agentId: z.string().min(1, "Agent ID is required"),
  input: z.record(z.string(), z.any()), // Generic input object, validated by agent's inputSchema
  timeout: z.number().int().positive().max(60000).optional().default(30000), // Max 60s, default 30s
});

export type RunAgentRequest = z.infer<typeof RunAgentRequestSchema>;

/**
 * Success response schema
 */
export const RunAgentSuccessResponseSchema = z.object({
  ok: z.literal(true),
  agentId: z.string(),
  result: z.any(), // Agent-specific output
  executionTimeMs: z.number().optional(),
});

export type RunAgentSuccessResponse = z.infer<typeof RunAgentSuccessResponseSchema>;

/**
 * Error response schema
 */
export const RunAgentErrorResponseSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
  code: z.enum([
    "VALIDATION_ERROR",
    "AGENT_NOT_FOUND",
    "TIMEOUT_ERROR",
    "MODEL_ERROR",
    "UNKNOWN_ERROR",
  ]),
  details: z.any().optional(),
});

export type RunAgentErrorResponse = z.infer<typeof RunAgentErrorResponseSchema>;

/**
 * Union type for all possible responses
 */
export type RunAgentResponse = RunAgentSuccessResponse | RunAgentErrorResponse;

/**
 * Agent metadata schema for listing agents
 */
export const AgentMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

export type AgentMetadata = z.infer<typeof AgentMetadataSchema>;

/**
 * List agents response schema
 */
export const ListAgentsResponseSchema = z.object({
  ok: z.literal(true),
  agents: z.array(AgentMetadataSchema),
});

export type ListAgentsResponse = z.infer<typeof ListAgentsResponseSchema>;

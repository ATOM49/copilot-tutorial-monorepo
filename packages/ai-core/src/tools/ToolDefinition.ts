import { z } from "zod/v3";
import type { AgentContext } from "../agents/AgentDefinition.js";

/**
 * Request context passed to tools. Reuses the agent context shape for now.
 */
export interface ToolContext extends AgentContext {}

/**
 * Core tool definition that encapsulates:
 * - Unique identifier
 * - Human-readable name
 * - Input schema (Zod)
 * - Execution logic
 */
export interface ToolPermissions {
  requiredRoles?: string[];
  allowedTenants?: string[];
}

export interface ToolDefinition<
  TInput extends z.ZodTypeAny = z.ZodTypeAny,
  TOutput extends z.ZodTypeAny = z.ZodTypeAny
> {
  /**
   * Unique identifier for the tool (e.g., "time", "calculator").
   * This is also the tool-calling name exposed to the LLM, so it must be stable and unique.
   */
  id: string;

  /** Human-readable name for the UI */
  name: string;

  /** Optional description shown to the LLM to decide when/how to use this tool */
  description?: string;

  /** Optional permissions guard (roles/tenant) evaluated before execution */
  permissions?: ToolPermissions;

  /** Zod schema describing the expected input structure */
  inputSchema: TInput;

  /**
   * Execute the tool with validated input
   * @param input - pre-validated input matching `inputSchema`
   * @param context - request/contextual information (auth, tenant, signal)
   */
  run(
    input: z.infer<TInput>,
    context: ToolContext
  ): Promise<z.infer<TOutput>>;
}

export type { z };

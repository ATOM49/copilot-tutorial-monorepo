import { z } from "zod/v3";
import type { ToolDefinition } from "../tools/ToolDefinition.js";
import type { ToolRegistry } from "../tools/ToolRegistry.js";

/**
 * Core agent definition that encapsulates:
 * - Unique identifier
 * - Display name
 * - Input/output schemas (Zod)
 * - Execution logic
 */
export interface AgentDefinition<
  TInput extends z.ZodTypeAny = z.ZodTypeAny,
  TOutput extends z.ZodTypeAny = z.ZodTypeAny
> {
  /**
   * Unique identifier for this agent (e.g., "product-qa", "code-review")
   */
  id: string;

  /**
   * Human-readable name for UI display
   */
  name: string;

  /**
   * Zod schema describing the expected input structure
   */
  inputSchema: TInput;

  /**
   * Zod schema describing the output structure
   */
  outputSchema: TOutput;

  /**
   * Execute the agent logic with validated input
   * @param input - Pre-validated input matching inputSchema
   * @param context - Optional request context (auth, tenant, etc.)
   * @returns Promise resolving to output matching outputSchema
   */
  run(
    input: z.infer<TInput>,
    context?: AgentContext
  ): Promise<z.infer<TOutput>>;
}

/**
 * Request context passed to agents for auth/tenant awareness
 */
export interface AgentLogger {
  info: (obj: Record<string, unknown>, msg?: string) => void;
  warn: (obj: Record<string, unknown>, msg?: string) => void;
  error: (obj: Record<string, unknown>, msg?: string) => void;
}

export interface AgentContext {
  userId: string;
  tenantId: string;
  roles?: string[];
  requestId?: string;
  traceId?: string;
  agentId?: string;
  logger?: AgentLogger;
  signal?: AbortSignal; // For timeout and cancellation support
  emit?: (event: Record<string, unknown>) => void;
  tools?: ToolDefinition[]; // Allowed tool definitions resolved upstream
  toolRegistry?: ToolRegistry; // Registry reference for advanced lookups (optional)
}

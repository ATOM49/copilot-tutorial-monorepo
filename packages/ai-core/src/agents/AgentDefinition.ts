import { z } from "zod/v3";

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
export interface AgentContext {
  userId: string;
  tenantId: string;
  roles?: string[];
}

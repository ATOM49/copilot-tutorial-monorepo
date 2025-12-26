import type { FastifyPluginAsync } from "fastify";
import { agentRegistry, productQAAgent } from "@copilot/ai-core";
import type { AgentContext } from "@copilot/ai-core";
import {
  RunAgentRequestSchema,
  type RunAgentRequest,
  type RunAgentSuccessResponse,
  type ListAgentsResponse,
} from "@copilot/shared";
import { AgentNotFoundError, TimeoutError, ModelError, ValidationError } from "../lib/errors.js";

// Register the Product Q&A agent on module load
agentRegistry.register(productQAAgent);

/**
 * Helper to run agent with timeout and abort handling
 */
async function runAgentWithTimeout<T>(
  agentFn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number
): Promise<T> {
  const abortController = new AbortController();
  
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      abortController.abort();
      reject(new TimeoutError(`Agent execution exceeded ${timeoutMs}ms timeout`));
    }, timeoutMs);

    agentFn(abortController.signal)
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        // If already aborted due to timeout, the timeout error was already rejected
        if (!abortController.signal.aborted) {
          reject(error);
        }
      });
  });
}

/**
 * Copilot agent execution routes
 */
export const copilotAgentRoutes: FastifyPluginAsync = async (app) => {
  /**
   * POST /copilot/run
   * Execute an agent by ID with validated input, timeout handling, and proper error normalization
   * 
   * This endpoint implements all Day 4 requirements:
   * 1. Type-safe request validation via Zod schemas
   * 2. Auth context passed to agents
   * 3. Normalized error responses with proper HTTP codes
   * 4. Timeout and abort handling for LLM calls
   */
  app.post<{
    Body: RunAgentRequest;
  }>("/copilot/run", {
    schema: {
      body: RunAgentRequestSchema,
    },
  }, async (req, reply) => {
    const body: RunAgentRequest = req.body;
    const startTime = Date.now();
    const { agentId, input, timeout } = body;

    // Get agent from registry (throws AgentNotFoundError if not found)
    const agent = agentRegistry.get(agentId);
    if (!agent) {
      throw new AgentNotFoundError(agentId);
    }

    // Validate input against agent's specific schema
    let validatedInput;
    try {
      validatedInput = agent.inputSchema.parse(input);
    } catch (error) {
      throw new ValidationError("Invalid input for agent", error);
    }

    // Extract auth context from request (populated by authContext plugin)
    const context: AgentContext = {
      userId: req.auth.userId,
      tenantId: req.auth.tenantId,
      roles: req.auth.roles,
    };

    req.log.info({
      agentId,
      userId: context.userId,
      tenantId: context.tenantId,
    }, "Executing agent");

    // Execute agent with timeout handling
    try {
      const result = await runAgentWithTimeout(
        (signal) => agent.run(validatedInput, { ...context, signal }),
        timeout ?? 30000 // Default 30s timeout
      );

      const executionTimeMs = Date.now() - startTime;
      
      req.log.info({
        agentId,
        executionTimeMs,
      }, "Agent execution completed");

      const response: RunAgentSuccessResponse = {
        ok: true,
        agentId: agent.id,
        result,
        executionTimeMs,
      };

      return response;
    } catch (error) {
      // TimeoutError is already handled by error handler
      if (error instanceof TimeoutError) {
        throw error;
      }

      // Wrap LLM/model errors
      if (error instanceof Error) {
        req.log.error({
          err: error,
          agentId,
        }, "Agent execution failed");
        
        throw new ModelError(
          `Agent execution failed: ${error.message}`,
          { originalError: error.message }
        );
      }

      throw error;
    }
  });

  /**
   * GET /copilot/agents
   * List all available agents (metadata only)
   */
  app.get("/copilot/agents", async () => {
    const agents = agentRegistry.listMetadata();
    
    const response: ListAgentsResponse = {
      ok: true,
      agents,
    };
    
    return response;
  });

  /**
   * GET /copilot/agents/:agentId
   * Get detailed information about a specific agent
   */
  app.get<{ Params: { agentId: string } }>(
    "/copilot/agents/:agentId",
    async (req) => {
      const agent = agentRegistry.get(req.params.agentId);
      
      if (!agent) {
        throw new AgentNotFoundError(req.params.agentId);
      }

      return {
        ok: true,
        agent: {
          id: agent.id,
          name: agent.name,
          // Note: We don't expose the run function or full schemas over HTTP
          // Only metadata for UI purposes
        },
      };
    }
  );
};

import type { FastifyPluginAsync } from "fastify";
import { agentRegistry, productQAAgent } from "@copilot/ai-core";
import { z } from "zod";

// Register the Product Q&A agent on module load
agentRegistry.register(productQAAgent);

/**
 * Request schema for running an agent
 */
const RunAgentRequestSchema = z.object({
  agentId: z.string(),
  input: z.record(z.string(), z.any()), // Generic input object, validated by agent's inputSchema
});

/**
 * Copilot agent execution routes
 */
export const copilotAgentRoutes: FastifyPluginAsync = async (app) => {
  /**
   * POST /copilot/run
   * Execute an agent by ID with validated input
   */
  app.post("/copilot/run", async (req, reply) => {
    try {
      // Parse request body
      const { agentId, input } = RunAgentRequestSchema.parse(req.body);

      // Get agent from registry
      const agent = agentRegistry.get(agentId);

      // Validate input against agent's schema
      const validatedInput = agent.inputSchema.parse(input);

      // Extract auth context from request
      const context = {
        userId: req.auth.userId,
        tenantId: req.auth.tenantId,
        roles: req.auth.roles,
      };

      // Execute agent
      const result = await agent.run(validatedInput, context);

      // Return result
      return {
        ok: true as const,
        agentId: agent.id,
        result,
      };
    } catch (error) {
      // Handle validation errors
      if (error && typeof error === 'object' && 'issues' in error) {
        return reply.code(400).send({
          ok: false as const,
          error: "Validation error",
          details: (error as { issues: unknown }).issues,
        });
      }

      // Handle agent not found
      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          ok: false as const,
          error: error.message,
        });
      }

      // Handle other errors
      throw error;
    }
  });

  /**
   * GET /copilot/agents
   * List all available agents (metadata only)
   */
  app.get("/copilot/agents", async () => {
    const agents = agentRegistry.listMetadata();
    return {
      ok: true as const,
      agents,
    };
  });

  /**
   * GET /copilot/agents/:agentId
   * Get detailed information about a specific agent
   */
  app.get<{ Params: { agentId: string } }>(
    "/copilot/agents/:agentId",
    async (req, reply) => {
      try {
        const agent = agentRegistry.get(req.params.agentId);
        return {
          ok: true as const,
          agent: {
            id: agent.id,
            name: agent.name,
            // Note: We don't expose the run function or full schemas over HTTP
            // Only metadata for UI purposes
          },
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          return reply.code(404).send({
            ok: false as const,
            error: error.message,
          });
        }
        throw error;
      }
    }
  );
};

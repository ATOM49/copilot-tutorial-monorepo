import type { FastifyPluginAsync } from "fastify";
import { randomUUID } from "node:crypto";
import {
  agentRegistry,
  productQAAgent,
  toolRegistry,
  timeTool,
  calculatorTool,
  searchDocsTool,
} from "@copilot/ai-core";
import type { AgentContext, ToolDefinition } from "@copilot/ai-core";
import {
  RunAgentRequestSchema,
  type RunAgentRequest,
  type RunAgentSuccessResponse,
  type ListAgentsResponse,
} from "@copilot/shared";
import { AgentNotFoundError, TimeoutError, ModelError, ValidationError } from "../lib/errors.js";

// Register agents on module load
agentRegistry.register(productQAAgent);

// Register tools on module load
toolRegistry.register(timeTool);
toolRegistry.register(calculatorTool);
toolRegistry.register(searchDocsTool);

// Set up allowlists for agents (can be extended later)
toolRegistry.setAllowlist("product-qa", ["search-docs", "time", "calculator"]);
/**
 * Helper to run agent with timeout and abort handling
 *
 * - Uses the provided AbortController (so callers can abort on client disconnect)
 * - Aborts on timeout
 */
async function runAgentWithTimeout<T>(
  agentFn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  abortController: AbortController = new AbortController()
): Promise<T> {
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
        // If already aborted due to timeout or external abort, surface the error to caller
        reject(error);
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

    const allowedTools = toolRegistry.getAllowedTools(agentId);
    const requestId = req.id;
    const traceId = randomUUID();

    // Extract auth context from request (populated by authContext plugin)
    const agentContext: AgentContext = {
      userId: req.auth.userId,
      tenantId: req.auth.tenantId,
      roles: req.auth.roles,
      tools: allowedTools,
      toolRegistry,
      requestId,
      traceId,
      agentId: agent.id,
      logger: req.log,
    };

    req.log.info({
      agentId,
      userId: agentContext.userId,
      tenantId: agentContext.tenantId,
    }, "Executing agent");

    // Execute agent with timeout handling
    try {
      const result = await runAgentWithTimeout(
        (signal) => agent.run(validatedInput, { ...agentContext, signal }),
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
   * POST /copilot/stream
   * Server-Sent Events (SSE) endpoint that streams agent execution status and final result.
   * Accepts the same body as /copilot/run and emits events: `status`, `result`, `error`, `done`.
   */
  app.post<{
    Body: RunAgentRequest;
  }>("/copilot/stream", {
    schema: {
      body: RunAgentRequestSchema,
    },
  }, async (req, reply) => {
    const body: RunAgentRequest = req.body;
    const { agentId, input, timeout } = body;

    // Get agent
    const agent = agentRegistry.get(agentId);
    if (!agent) {
      throw new AgentNotFoundError(agentId);
    }

    // Validate input
    let validatedInput;
    try {
      validatedInput = agent.inputSchema.parse(input);
    } catch (error) {
      throw new ValidationError("Invalid input for agent", error);
    }

    const allowedTools = toolRegistry.getAllowedTools(agentId);
    const requestId = req.id;
    const traceId = randomUUID();

    // Extract auth context
    const agentContext: AgentContext = {
      userId: req.auth.userId,
      tenantId: req.auth.tenantId,
      roles: req.auth.roles,
      tools: allowedTools,
      toolRegistry,
      requestId,
      traceId,
      agentId: agent.id,
      logger: req.log,
    };

    // Prepare SSE response
    const raw = reply.raw;
    // Set CORS headers for hijacked response so browsers accept the streamed reply
    const origin = req.headers.origin as string | undefined;
    if (origin) {
      raw.setHeader("Access-Control-Allow-Origin", origin);
      raw.setHeader("Vary", "Origin");
      raw.setHeader("Access-Control-Allow-Credentials", "true");
    }

    raw.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    raw.setHeader("Cache-Control", "no-cache");
    raw.setHeader("Connection", "keep-alive");
    // Disable buffering (for some proxies)
    raw.setHeader("X-Accel-Buffering", "no");
    raw.flushHeaders?.();

    // Tell Fastify we are managing the response manually
    reply.hijack();

    const writeEvent = (event: string, data: any) => {
      try {
        const payload = typeof data === "string" ? data : JSON.stringify(data);
        raw.write(`event: ${event}\n`);
        raw.write(`data: ${payload}\n\n`);
      } catch {
        // ignore write errors
      }
    };

    const streamEmit: NonNullable<AgentContext["emit"]> = (evt) => {
      if (!evt || typeof evt !== "object") return;
      const type = (evt as { type?: string }).type;

      switch (type) {
        case "status":
          writeEvent("status", { status: (evt as { status?: string }).status, agentId });
          break;
        case "tool_start":
        case "tool_end":
          writeEvent("tool", { agentId, ...evt });
          break;
        default:
          writeEvent("event", { agentId, ...evt });
      }
    };

    // Heartbeat (keeps proxies from closing idle SSE connections)
    const heartbeat = setInterval(() => {
      try {
        raw.write(":\n\n");
      } catch {
        // ignore
      }
    }, 15000);

    const startTime = Date.now();

    // Abort on client disconnect
    const abortController = new AbortController();
    raw.on("close", () => {
      abortController.abort();
      clearInterval(heartbeat);
    });

    // Initial status (align to UI: thinking/running/done)
    writeEvent("status", { status: "thinking", agentId });

    try {
      const result = await runAgentWithTimeout(
        (signal) => agent.run(validatedInput, { ...agentContext, emit: streamEmit, signal }),
        timeout ?? 30000,
        abortController
      );

      const executionTimeMs = Date.now() - startTime;

      // Final result
      writeEvent("result", { ok: true, agentId: agent.id, result, executionTimeMs });
      writeEvent("status", { status: "done", executionTimeMs });
      writeEvent("done", { ok: true });

      clearInterval(heartbeat);
      raw.end();
      return;
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;

      // If the client disconnected, just end quietly
      if (abortController.signal.aborted) {
        clearInterval(heartbeat);
        try { raw.end(); } catch {}
        return;
      }

      if (error instanceof TimeoutError) {
        writeEvent("error", { error: error.message, code: "timeout", executionTimeMs });
        writeEvent("done", { ok: false });
        clearInterval(heartbeat);
        raw.end();
        return;
      }

      if (error instanceof Error) {
        req.log.error({ err: error, agentId }, "Agent stream execution failed");
        writeEvent("error", { error: error.message, executionTimeMs });
        writeEvent("done", { ok: false });
        clearInterval(heartbeat);
        raw.end();
        return;
      }

      clearInterval(heartbeat);
      raw.end();
      return;
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

  /**
   * GET /copilot/tools
   * List all available tools
   */
  app.get("/copilot/tools", async (req) => {
    const tools = toolRegistry.listMetadata();
    
    return {
      ok: true,
      tools,
    };
  });

  /**
   * GET /copilot/agents/:agentId/tools
   * Get the allowed tools for a specific agent
   */
  app.get<{ Params: { agentId: string } }>(
    "/copilot/agents/:agentId/tools",
    async (req) => {
      const { agentId } = req.params;
      
      // Verify agent exists
      const agent = agentRegistry.get(agentId);
      if (!agent) {
        throw new AgentNotFoundError(agentId);
      }

      const allowedTools = toolRegistry.getAllowedTools(agentId);
      const availableTools = toolRegistry.listMetadata();

      return {
        ok: true,
        agentId,
        allowedTools: allowedTools.map((t: ToolDefinition) => ({
          id: t.id,
          name: t.name,
        })),
        availableTools,
      };
    }
  );

  /**
   * POST /copilot/agents/:agentId/tools
   * Set the allowed tools for a specific agent
   */
  app.post<{ Params: { agentId: string }; Body: { toolIds: string[] } }>(
    "/copilot/agents/:agentId/tools",
    async (req) => {
      const { agentId } = req.params;
      const { toolIds } = req.body;

      // Verify agent exists
      const agent = agentRegistry.get(agentId);
      if (!agent) {
        throw new AgentNotFoundError(agentId);
      }

      // Validate tool IDs exist
      for (const toolId of toolIds) {
        if (!toolRegistry.has(toolId)) {
          throw new ValidationError(`Tool with id "${toolId}" not found`);
        }
      }

      // Set the allowlist
      toolRegistry.setAllowlist(agentId, toolIds);

      const allowedTools = toolRegistry.getAllowedTools(agentId);

      return {
        ok: true,
        agentId,
        allowedTools: allowedTools.map((t: ToolDefinition) => ({
          id: t.id,
          name: t.name,
        })),
      };
    }
  );
};

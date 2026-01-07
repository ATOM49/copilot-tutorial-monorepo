import type { FastifyPluginAsync } from "fastify";
import fastifyPlugin from "fastify-plugin";
import { ZodError } from "zod";
import { CopilotError } from "../lib/errors.js";
import type { RunAgentErrorResponse } from "@copilot/shared";

/**
 * Global error handler for Copilot API
 * Normalizes errors into consistent response format
 */
const errorHandlerPlugin: FastifyPluginAsync = async (app) => {
  app.setErrorHandler((error, request, reply) => {
    // Log the error for debugging
    request.log.error({
      err: error,
      url: request.url,
      method: request.method,
    });

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const response: RunAgentErrorResponse = {
        ok: false,
        error: "Validation error",
        code: "VALIDATION_ERROR",
        details: error.issues,
      };
      return reply.code(400).send(response);
    }

    // Handle our custom CopilotError types
    if (error instanceof CopilotError) {
      const response: RunAgentErrorResponse = {
        ok: false,
        error: error.message,
        code: error.code as RunAgentErrorResponse["code"],
        details: error.details,
      };
      return reply.code(error.statusCode).send(response);
    }

    // Handle generic errors
    const response: RunAgentErrorResponse = {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Internal server error",
      code: "UNKNOWN_ERROR",
    };

    return reply.code(500).send(response);
  });
};

export const errorHandler = fastifyPlugin(errorHandlerPlugin, {
  name: "error-handler",
});

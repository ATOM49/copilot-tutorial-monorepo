/**
 * Custom error types for the Copilot API
 * These help distinguish between different failure modes
 */

export class CopilotError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "CopilotError";
  }
}

export class ValidationError extends CopilotError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
  }
}

export class AgentNotFoundError extends CopilotError {
  constructor(agentId: string) {
    super(`Agent '${agentId}' not found`, "AGENT_NOT_FOUND", 404);
    this.name = "AgentNotFoundError";
  }
}

export class TimeoutError extends CopilotError {
  constructor(message: string = "Request timeout") {
    super(message, "TIMEOUT_ERROR", 408);
    this.name = "TimeoutError";
  }
}

export class ModelError extends CopilotError {
  constructor(message: string, details?: unknown) {
    super(message, "MODEL_ERROR", 500, details);
    this.name = "ModelError";
  }
}

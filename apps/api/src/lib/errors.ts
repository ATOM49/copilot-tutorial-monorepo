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

export class PendingActionError extends CopilotError {
  constructor(message: string, code: string, statusCode: number) {
    super(message, code, statusCode);
    this.name = "PendingActionError";
  }
}

export class PendingActionNotFoundError extends PendingActionError {
  constructor(actionId: string) {
    super(`Pending action '${actionId}' not found`, "ACTION_NOT_FOUND", 404);
    this.name = "PendingActionNotFoundError";
  }
}

export class PendingActionExpiredError extends PendingActionError {
  constructor(actionId: string) {
    super(`Pending action '${actionId}' expired`, "ACTION_EXPIRED", 410);
    this.name = "PendingActionExpiredError";
  }
}

export class PendingActionMismatchError extends PendingActionError {
  constructor() {
    super(
      "Action confirmation requester does not match the original proposer",
      "ACTION_MISMATCH",
      403
    );
    this.name = "PendingActionMismatchError";
  }
}

export class PendingActionStateError extends PendingActionError {
  constructor(status: string) {
    super(
      `Pending action is not executable in '${status}' state`,
      "ACTION_STATE_INVALID",
      409
    );
    this.name = "PendingActionStateError";
  }
}

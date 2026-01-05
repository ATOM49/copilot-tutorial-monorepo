export type ToolAuditEvent =
  | {
      type: "tool_invocation_start";
      ts: string;
      traceId: string;
      requestId: string;
      userId: string;
      tenantId: string;
      agentId: string;
      toolId: string;
      inputSummary?: string;
    }
  | {
      type: "tool_invocation_end";
      ts: string;
      traceId: string;
      requestId: string;
      userId: string;
      tenantId: string;
      agentId: string;
      toolId: string;
      ok: boolean;
      durationMs: number;
      error?: string;
      outputSummary?: string;
    };

import { tool as langChainTool } from "@langchain/core/tools";
import type { ToolInterface } from "@langchain/core/tools";
import { z } from "zod/v3";
import type { ToolAuditEvent } from "@copilot/shared";
import type { ToolDefinition, ToolContext } from "./ToolDefinition.js";
import { ToolPermissionError } from "./errors.js";

type AnyToolDefinition = ToolDefinition<z.ZodTypeAny, z.ZodTypeAny>;

const SENSITIVE_FIELD_PATTERN = /(token|secret|password|api[_-]?key)/i;
const SUMMARY_LIMIT = 240;

function truncate(value: string, limit = SUMMARY_LIMIT): string {
  return value.length > limit ? `${value.slice(0, limit)}…` : value;
}

function summarizeValue(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return truncate(value.trim(), 120);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    if (!value.length) return [];
    if (depth > 1) return `[array length=${value.length}]`;
    return value.slice(0, 3).map((entry) => summarizeValue(entry, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(
      value as Record<string, unknown>
    ).slice(0, 6)) {
      if (SENSITIVE_FIELD_PATTERN.test(key)) {
        out[key] = "[redacted]";
        continue;
      }
      out[key] = summarizeValue(val, depth + 1);
    }
    return out;
  }
  return String(value);
}

function safeSummary(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  try {
    const summarized = summarizeValue(value);
    if (summarized === undefined || summarized === null) return undefined;
    const serialized =
      typeof summarized === "string" ? summarized : JSON.stringify(summarized);
    return serialized.length > SUMMARY_LIMIT
      ? `${serialized.slice(0, SUMMARY_LIMIT)}…`
      : serialized;
  } catch {
    return undefined;
  }
}

function baseAuditFields(def: AnyToolDefinition, ctx: ToolContext) {
  return {
    traceId: ctx.traceId ?? "unknown-trace",
    requestId: ctx.requestId ?? "unknown-request",
    userId: ctx.userId ?? "unknown-user",
    tenantId: ctx.tenantId ?? "unknown-tenant",
    agentId: ctx.agentId ?? "unknown-agent",
    toolId: def.id,
  } as const;
}

function emitAuditEvent(
  ctx: ToolContext,
  event: ToolAuditEvent,
  level: "info" | "warn" = "info"
) {
  const logger = ctx.logger;
  if (!logger) return;
  if (level === "warn") {
    logger.warn(event);
  } else {
    logger.info(event);
  }
  ctx.emit?.(event);
}

function enforceToolPermissions(def: AnyToolDefinition, ctx: ToolContext) {
  const permissions = def.permissions;
  if (!permissions) return;

  const roles = ctx.roles ?? [];
  if (permissions.requiredRoles?.length) {
    const missing = permissions.requiredRoles.filter(
      (role) => !roles.includes(role)
    );
    if (missing.length) {
      throw new ToolPermissionError(
        `Missing required role${
          permissions.requiredRoles.length > 1 ? "s" : ""
        } (${permissions.requiredRoles.join(", ")}) for tool "${def.id}"`
      );
    }
  }

  if (permissions.allowedTenants?.length) {
    if (!permissions.allowedTenants.includes(ctx.tenantId)) {
      throw new ToolPermissionError(
        `Tenant "${ctx.tenantId ?? "unknown"}" is not allowed to use tool "${
          def.id
        }"`
      );
    }
  }
}

export function toolDefToLangChainTool(
  def: AnyToolDefinition,
  ctx: ToolContext
): ToolInterface {
  // NOTE: LangChain's `tool()` has heavy generic inference when used with Zod schemas.
  // In a monorepo this can trigger TS2589 (excessively deep type instantiation).
  // We intentionally erase types at this boundary; runtime safety is preserved via Zod parsing.

  const t = langChainTool(
    async (input: unknown, config: any): Promise<string> => {
      // validate input for safety + schema guarantees
      const parsed = def.inputSchema.parse(input);

      // propagate abort signal (prefer config.signal if present)
      const signal = config?.signal ?? ctx.signal;

      const auditBase = baseAuditFields(def, ctx);
      const startEvent: ToolAuditEvent = {
        type: "tool_invocation_start",
        ts: new Date().toISOString(),
        ...auditBase,
        inputSummary: safeSummary(parsed),
      };
      emitAuditEvent(ctx, startEvent);

      const startedAt = Date.now();

      try {
        enforceToolPermissions(def, ctx);
        const out = await def.run(parsed as any, { ...(ctx as any), signal });

        const successEvent: ToolAuditEvent = {
          type: "tool_invocation_end",
          ts: new Date().toISOString(),
          ...auditBase,
          ok: true,
          durationMs: Date.now() - startedAt,
          outputSummary: safeSummary(out),
        };
        emitAuditEvent(ctx, successEvent);

        // ToolMessage content must be string-ish; stringify objects
        return typeof out === "string" ? out : JSON.stringify(out);
      } catch (error) {
        const err = error as Error | undefined;
        const failureEvent: ToolAuditEvent = {
          type: "tool_invocation_end",
          ts: new Date().toISOString(),
          ...auditBase,
          ok: false,
          durationMs: Date.now() - startedAt,
          error: err?.message ? truncate(err.message) : "Tool failed",
        };
        emitAuditEvent(ctx, failureEvent, "warn");
        throw error;
      }
    },
    {
      // IMPORTANT: this name is what the model will call
      name: def.id,
      description: def.description ?? def.name,
      // Erase schema typing to avoid deep generic inference; Zod still validates at runtime
      schema: def.inputSchema,
    } as any
  );

  return t as unknown as ToolInterface;
}

export function toolDefsToLangChainTools(
  defs: AnyToolDefinition[],
  ctx: ToolContext
): { tools: ToolInterface[]; toolsByName: Map<string, ToolInterface> } {
  const tools = defs.map((d) => toolDefToLangChainTool(d, ctx));
  const toolsByName = new Map(tools.map((t) => [t.name, t]));
  return { tools, toolsByName };
}

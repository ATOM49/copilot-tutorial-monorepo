import { BaseLanguageModelInput } from "@langchain/core/language_models/base";
import {
  SystemMessage,
  HumanMessage,
  ToolMessage,
} from "@langchain/core/messages";
import type { AIMessageChunk, BaseMessage } from "@langchain/core/messages";
import { Runnable } from "@langchain/core/runnables";
import type { ToolInterface } from "@langchain/core/tools";
import { ChatOpenAICallOptions } from "@langchain/openai";
import { ToolPermissionError } from "../tools/errors.js";
import type { ToolDefinition } from "../tools/ToolDefinition.js";
import { toolRequiresConfirmation } from "../tools/ToolDefinition.js";

type Emit = (evt: any) => void;

const DEFAULT_TOOL_TIMEOUT_MS = 8000;
const MAX_SAFE_DETAIL_LENGTH = 160;

type ToolErrorReason =
  | "NOT_FOUND"
  | "TIMEOUT"
  | "EXECUTION_ERROR"
  | "CANCELLED"
  | "PERMISSION_DENIED"
  | "CONFIRMATION_REQUIRED";

const SAFE_TOOL_ERROR_MESSAGES: Record<ToolErrorReason, string> = {
  NOT_FOUND: "Tool is not available for this agent.",
  TIMEOUT: "Tool timed out before completing.",
  EXECUTION_ERROR: "Tool failed to execute safely.",
  CANCELLED: "Tool run was cancelled before it finished.",
  PERMISSION_DENIED: "Tool usage is not permitted for this request.",
  CONFIRMATION_REQUIRED:
    "This tool requires explicit confirmation before it can run.",
};

function sanitizeDetail(detail?: string): string | undefined {
  if (!detail) return undefined;
  return detail.length > MAX_SAFE_DETAIL_LENGTH
    ? `${detail.slice(0, MAX_SAFE_DETAIL_LENGTH)}…`
    : detail;
}

function safeToolErrorContent(
  reason: ToolErrorReason,
  detail?: string
): string {
  const payload: Record<string, unknown> = {
    ok: false,
    reason,
    message: SAFE_TOOL_ERROR_MESSAGES[reason],
  };
  const sanitized = sanitizeDetail(detail);
  if (sanitized) payload.detail = sanitized;
  return JSON.stringify(payload);
}

function forwardAbort(
  source: AbortSignal | undefined,
  target: AbortController,
  onAbort?: () => void
) {
  if (!source) return () => {};

  if (source.aborted) {
    onAbort?.();
    target.abort(source.reason);
    return () => {};
  }

  const handler = () => {
    onAbort?.();
    target.abort(source.reason);
  };

  source.addEventListener("abort", handler, { once: true });
  return () => source.removeEventListener("abort", handler);
}

function extractToolCalls(ai: any): Array<{ id: string; name: string; args: any }> {
  if (Array.isArray(ai?.tool_calls)) return ai.tool_calls;
  const tc = ai?.additional_kwargs?.tool_calls;
  return Array.isArray(tc) ? tc : [];
}

export async function runToolCallingLoop(args: {
  modelWithTools: Runnable<
    BaseLanguageModelInput,
    AIMessageChunk,
    ChatOpenAICallOptions
  >;
  toolsByName: Map<string, ToolInterface>;
  toolDefsByName: Map<string, ToolDefinition>;
  system: string;
  userInput: string;
  signal?: AbortSignal;
  emit?: Emit;
  maxSteps?: number;
  toolTimeoutMs?: number;
}): Promise<BaseMessage[]> {
  const {
    modelWithTools,
    toolsByName,
    toolDefsByName,
    system,
    userInput,
    signal,
    emit,
    maxSteps = 6,
    toolTimeoutMs = DEFAULT_TOOL_TIMEOUT_MS,
  } = args;

  const messages: BaseMessage[] = [
    new SystemMessage(system),
    new HumanMessage(userInput),
  ];

  for (let step = 0; step < maxSteps; step++) {
    emit?.({ type: "status", status: "thinking" });

    const ai = await modelWithTools.invoke(messages, { signal });
    messages.push(ai);

    const toolCalls = extractToolCalls(ai);
    if (!toolCalls.length) break;

    emit?.({ type: "status", status: "running" });

    for (const call of toolCalls) {
      const toolImpl = toolsByName.get(call.name);
      const toolDef = toolDefsByName.get(call.name);

      emit?.({ type: "tool_start", name: call.name });

      if (!toolImpl) {
        messages.push(
          new ToolMessage({
            tool_call_id: call.id,
            content: safeToolErrorContent("NOT_FOUND"),
          })
        );
        emit?.({
          type: "tool_end",
          name: call.name,
          ok: false,
          reason: "not_found",
        });
        continue;
      }

      if (toolDef && toolRequiresConfirmation(toolDef)) {
        messages.push(
          new ToolMessage({
            tool_call_id: call.id,
            content: safeToolErrorContent("CONFIRMATION_REQUIRED"),
          })
        );
        emit?.({
          type: "tool_end",
          name: call.name,
          ok: false,
          reason: "confirmation_required",
        });
        continue;
      }
      let timedOut = false;
      let cancelled = false;
      const toolAbort = new AbortController();

      try {
        const cleanupForward = forwardAbort(signal, toolAbort, () => {
          cancelled = true;
        });

        const timeout = setTimeout(() => {
          timedOut = true;
          toolAbort.abort(new Error(`Tool timeout after ${toolTimeoutMs}ms`));
        }, toolTimeoutMs);

        let result;
        try {
          result = await toolImpl.invoke(call.args, {
            signal: toolAbort.signal,
          });
        } finally {
          clearTimeout(timeout);
          cleanupForward();
        }

        messages.push(
          new ToolMessage({
            tool_call_id: call.id,
            content:
              typeof result === "string" ? result : JSON.stringify(result),
          })
        );
        emit?.({ type: "tool_end", name: call.name, ok: true });
      } catch (e: any) {
        const isPermissionError = e instanceof ToolPermissionError;
        const reason: ToolErrorReason = timedOut
          ? "TIMEOUT"
          : cancelled
          ? "CANCELLED"
          : isPermissionError
          ? "PERMISSION_DENIED"
          : "EXECUTION_ERROR";

        messages.push(
          new ToolMessage({
            tool_call_id: call.id,
            content: safeToolErrorContent(reason, e?.message),
          })
        );
        emit?.({
          type: "tool_end",
          name: call.name,
          ok: false,
          reason: reason.toLowerCase(),
        });
      }
    }
  }

  return messages;
}

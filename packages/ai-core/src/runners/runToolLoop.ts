import { SystemMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";
import type { ToolInterface } from "@langchain/core/tools";

type Emit = (evt: any) => void;

function extractToolCalls(ai: any): Array<{ id: string; name: string; args: any }> {
  // LangChain usually normalizes this to ai.tool_calls on tool-calling models
  if (Array.isArray(ai?.tool_calls)) return ai.tool_calls;
  // fallback (some versions/providers)
  const tc = ai?.additional_kwargs?.tool_calls;
  return Array.isArray(tc) ? tc : [];
}

export async function runToolCallingLoop(args: {
  modelWithTools: { invoke: (msgs: BaseMessage[], cfg?: any) => Promise<any> };
  toolsByName: Map<string, ToolInterface>;
  system: string;
  userInput: string;
  signal?: AbortSignal;
  emit?: Emit;
  maxSteps?: number;
}): Promise<BaseMessage[]> {
  const { modelWithTools, toolsByName, system, userInput, signal, emit, maxSteps = 6 } = args;

  const messages: BaseMessage[] = [new SystemMessage(system), new HumanMessage(userInput)];

  for (let step = 0; step < maxSteps; step++) {
    emit?.({ type: "status", status: "thinking" });

    const ai = await modelWithTools.invoke(messages, { signal });
    messages.push(ai);

    const toolCalls = extractToolCalls(ai);
    if (!toolCalls.length) break;

    emit?.({ type: "status", status: "running" });

    for (const call of toolCalls) {
      const toolImpl = toolsByName.get(call.name);

      emit?.({ type: "tool_start", name: call.name });

      if (!toolImpl) {
        messages.push(
          new ToolMessage({
            tool_call_id: call.id,
            content: JSON.stringify({ ok: false, error: `Tool not found: ${call.name}` }),
          })
        );
        emit?.({ type: "tool_end", name: call.name, ok: false });
        continue;
      }

      try {
        const result = await toolImpl.invoke(call.args, { signal });
        messages.push(
          new ToolMessage({
            tool_call_id: call.id,
            content: typeof result === "string" ? result : JSON.stringify(result),
          })
        );
        emit?.({ type: "tool_end", name: call.name, ok: true });
      } catch (e: any) {
        messages.push(
          new ToolMessage({
            tool_call_id: call.id,
            content: JSON.stringify({ ok: false, error: e?.message ?? "Tool failed" }),
          })
        );
        emit?.({ type: "tool_end", name: call.name, ok: false });
      }
    }
  }

  return messages;
}
import { tool as langChainTool } from "@langchain/core/tools";
import type { ToolInterface } from "@langchain/core/tools";
import { z } from "zod/v3";
import type { ToolDefinition, ToolContext } from "./ToolDefinition.js";

type AnyToolDefinition = ToolDefinition<z.ZodTypeAny, z.ZodTypeAny>;

// Helper type to reduce type inference depth at the LangChain tool() boundary
type AnyZod = z.ZodTypeAny;

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

      const out = await def.run(parsed as any, { ...(ctx as any), signal });

      // ToolMessage content must be string-ish; stringify objects
      return typeof out === "string" ? out : JSON.stringify(out);
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

import { z } from "zod/v3";
import type { Runnable } from "@langchain/core/runnables";
import type { BaseMessage } from "@langchain/core/messages";

/**
 * Run a structured extraction pipeline using a Zod schema.
 *
 * Accepts either a simple system/input pair (uses `simpleCopilotPrompt`) or an
 * explicit array of `BaseMessage`s when you already have a conversation log
 * (e.g., tool-aware agents). Always enforces the provided Zod schema.
 */
type StructuredModel<TSchema extends z.ZodTypeAny> = {
  withStructuredOutput: (
    schema: TSchema,
    options: { name: string; strict: boolean }
  ) => Runnable<unknown, z.infer<TSchema>>;
};

type RunStructuredArgs<TSchema extends z.ZodTypeAny> = {
  model: StructuredModel<TSchema>;
  schema: TSchema;
  strict?: boolean;
  signal?: AbortSignal;
  messages?: BaseMessage[];
};

export async function runStructured<TSchema extends z.ZodTypeAny>(
  args: RunStructuredArgs<TSchema>
): Promise<z.infer<TSchema>> {
  const structured = args.model.withStructuredOutput(args.schema, {
    name: "extract",
    strict: args.strict ?? true,
  });

  const config = args.signal ? { signal: args.signal } : undefined;

  if (args.messages?.length) {
    return structured.invoke(args.messages, config);
  }

  throw new Error(
    "runStructured requires messages; provide a message array to extract structured output"
  );
}

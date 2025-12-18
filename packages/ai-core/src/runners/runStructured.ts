import { z } from "zod/v3";
import type { Runnable } from "@langchain/core/runnables";
import { simpleCopilotPrompt } from "../prompts/copilotPrompts.js";

/**
 * Run a structured extraction pipeline using a Zod schema.
 *
 * OpenAI's `withStructuredOutput` requires a JSON schema with a `required`
 * array when `strict: true`. Some Zod schemas (e.g., with optional or default
 * fields) may violate this, so callers can opt-out of strict mode while still
 * leveraging Zod validation locally.
 */
export async function runStructured<TSchema extends z.ZodTypeAny>(args: {
  model: {
    withStructuredOutput: (
      schema: TSchema,
      options: { name: string; strict: boolean }
    ) => Runnable<any, z.infer<TSchema>>;
  };
  system: string;
  input: string;
  schema: TSchema;
  strict?: boolean;
}) {
  const prompt = simpleCopilotPrompt(args.system);
  const chain = prompt.pipe(
    args.model.withStructuredOutput(args.schema, {
      name: "extract",
      strict: args.strict ?? true,
    })
  );
  return chain.invoke({ input: args.input });
}

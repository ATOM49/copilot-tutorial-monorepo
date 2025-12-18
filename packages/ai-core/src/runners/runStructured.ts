import { z } from "zod/v3";
import type { Runnable } from "@langchain/core/runnables";
import { simpleCopilotPrompt } from "../prompts/copilotPrompts.js";

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
}) {
  const prompt = simpleCopilotPrompt(args.system);
  const chain = prompt.pipe(
    args.model.withStructuredOutput(args.schema, {
      name: "extract",
      strict: true,
    })
  );
  return chain.invoke({ input: args.input });
}

import { z } from "zod/v3";
import type { ToolDefinition, ToolContext } from "./ToolDefinition.js";

/**
 * Input schema for calculator tool
 */
export const CalculatorInputSchema = z.object({
  operation: z.enum(["add", "subtract", "multiply", "divide"]),
  a: z.number(),
  b: z.number(),
});

/**
 * Output schema for calculator tool
 */
export const CalculatorOutputSchema = z.object({
  result: z.number(),
  operation: z.string(),
  inputs: z.object({ a: z.number(), b: z.number() }),
});

export type CalculatorInput = z.infer<typeof CalculatorInputSchema>;
export type CalculatorOutput = z.infer<typeof CalculatorOutputSchema>;

/**
 * Calculator Tool
 * Performs basic mathematical operations
 */
export const calculatorTool: ToolDefinition<
  typeof CalculatorInputSchema,
  typeof CalculatorOutputSchema
> = {
  id: "calculator",
  name: "Calculator",
  inputSchema: CalculatorInputSchema,
  permissions: {
    requiredRoles: ["admin"],
    allowedTenants: ["dev-tenant"],
  },

  async run(
    input: CalculatorInput,
    _context: ToolContext
  ): Promise<CalculatorOutput> {
    let result: number;

    switch (input.operation) {
      case "add":
        result = input.a + input.b;
        break;
      case "subtract":
        result = input.a - input.b;
        break;
      case "multiply":
        result = input.a * input.b;
        break;
      case "divide":
        if (input.b === 0) {
          throw new Error("Division by zero");
        }
        result = input.a / input.b;
        break;
    }

    return {
      result,
      operation: input.operation,
      inputs: { a: input.a, b: input.b },
    };
  },
};

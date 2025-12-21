import { z } from "zod/v3";

export const DemoOutputSchema = z.object({
  answer: z.string(),
  confidence: z.number().min(0).max(1),
  nextSteps: z.array(z.string()).default([]),
});

export type DemoOutput = z.infer<typeof DemoOutputSchema>;

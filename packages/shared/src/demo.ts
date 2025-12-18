import { z } from "zod";

export const DemoOutputSchema = z.object({
  answer: z.string(),
  confidence: z.number().min(0).max(1),
  nextSteps: z.array(z.string()).default([]),
});

export type DemoOutput = z.infer<typeof DemoOutputSchema>;

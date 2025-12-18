import { z } from "zod";

export const HealthResponseSchema = z.object({
  ok: z.literal(true),
  service: z.string(),
  ts: z.string(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

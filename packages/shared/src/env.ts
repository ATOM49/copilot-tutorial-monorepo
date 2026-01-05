import { z } from "zod";

export const EnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export const DEFAULTS = {
  NEXT_PUBLIC_API_URL: "http://localhost:3001",
  OPENAI_MODEL: "gpt-4o-mini",
};

export function getEnv() {
  const parsed = EnvSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
  });

  if (!parsed.success) {
    // Don't throw here — prefer sane defaults and let callers handle missing secrets.
    // Log a helpful warning in development.
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("@copilot/shared: env validation warnings:", parsed.error.format());
    }
  }

  const data = (parsed.success ? parsed.data : {}) as Partial<Env>;

  return {
    NEXT_PUBLIC_API_URL: data.NEXT_PUBLIC_API_URL ?? DEFAULTS.NEXT_PUBLIC_API_URL,
    OPENAI_API_KEY: data.OPENAI_API_KEY,
    OPENAI_MODEL: data.OPENAI_MODEL ?? DEFAULTS.OPENAI_MODEL,
  } as {
    NEXT_PUBLIC_API_URL: string;
    OPENAI_API_KEY?: string;
    OPENAI_MODEL: string;
  };
}

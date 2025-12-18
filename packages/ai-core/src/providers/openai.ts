import { ChatOpenAI } from "@langchain/openai";

export type OpenAIChatModelConfig = {
  model: string; // e.g. "gpt-4o-mini" (choose what you have access to)
  temperature?: number;
  apiKey?: string; // defaults to process.env.OPENAI_API_KEY
};

export function createOpenAIChatModel(cfg: OpenAIChatModelConfig) {
  return new ChatOpenAI({
    model: cfg.model,
    temperature: cfg.temperature ?? 0,
    apiKey: cfg.apiKey ?? process.env.OPENAI_API_KEY,
  });
}

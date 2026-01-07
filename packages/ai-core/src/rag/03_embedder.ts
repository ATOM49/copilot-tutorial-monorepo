import { OpenAIEmbeddings } from "@langchain/openai";
import type { DocChunk } from "./02_chunker.js";

export type EmbedOptions = {
  model?: string;
  apiKey?: string;
};

export type EmbeddedChunk = DocChunk & {
  embedding: number[];
};

const DEFAULT_EMBED_MODEL = "text-embedding-3-small";

export async function embedChunks(
  chunks: DocChunk[],
  options: EmbedOptions = {}
): Promise<EmbeddedChunk[]> {
  if (!chunks.length) return [];

  const embedder = new OpenAIEmbeddings({
    model: options.model ?? DEFAULT_EMBED_MODEL,
    apiKey: options.apiKey ?? process.env.OPENAI_API_KEY,
  });

  const vectors = await embedder.embedDocuments(chunks.map((c) => c.content));

  return vectors.map((embedding, idx) => ({
    ...chunks[idx],
    embedding,
  }));
}

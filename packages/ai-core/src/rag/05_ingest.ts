import { loadLocalMarkdownDocs } from "./01_docLoader.js";
import { chunkMarkdownDocs, type ChunkOptions } from "./02_chunker.js";
import { embedChunks } from "./03_embedder.js";
import {
  resolveVectorStoreConfig,
  upsertChunks,
  type VectorStoreConfig,
} from "./04_vectorStore.js";

export type IngestOptions = {
  directory?: string;
  chunkOptions?: ChunkOptions;
  vectorStore?: VectorStoreConfig;
};

export type IngestStats = {
  docs: number;
  chunks: number;
  embeddings: number;
  indexPath: string;
  durationMs: number;
};

export async function ingestLocalDocs(
  options: IngestOptions = {}
): Promise<IngestStats> {
  const startedAt = Date.now();
  const docs = await loadLocalMarkdownDocs(options.directory);
  const resolved = resolveVectorStoreConfig(options.vectorStore);

  if (!docs.length) {
    return {
      docs: 0,
      chunks: 0,
      embeddings: 0,
      indexPath: resolved.indexPath,
      durationMs: Date.now() - startedAt,
    };
  }

  const chunks = chunkMarkdownDocs(docs, options.chunkOptions);
  if (!chunks.length) {
    return {
      docs: docs.length,
      chunks: 0,
      embeddings: 0,
      indexPath: resolved.indexPath,
      durationMs: Date.now() - startedAt,
    };
  }

  const embedded = await embedChunks(chunks, {
    model: resolved.embedModel,
    apiKey: resolved.apiKey,
  });

  await upsertChunks(embedded, resolved);

  return {
    docs: docs.length,
    chunks: chunks.length,
    embeddings: embedded.length,
    indexPath: resolved.indexPath,
    durationMs: Date.now() - startedAt,
  };
}

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { Document } from "@langchain/core/documents";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OpenAIEmbeddings } from "@langchain/openai";
import type { EmbeddedChunk } from "./03_embedder.js";

export type VectorStoreConfig = {
  indexPath?: string;
  embedModel?: string;
  apiKey?: string;
};

export type ResolvedVectorStoreConfig = Required<Omit<VectorStoreConfig, "apiKey">> & {
  apiKey?: string;
};

export type VectorSearchResult = {
  chunk: Omit<EmbeddedChunk, "embedding">;
  score: number;
};

const DEFAULT_INDEX_PATH = path.resolve(process.cwd(), ".vectorstore/faiss");
const DEFAULT_EMBED_MODEL = "text-embedding-3-small";

export function resolveVectorStoreConfig(
  config: VectorStoreConfig = {}
): ResolvedVectorStoreConfig {
  return {
    indexPath: config.indexPath ?? DEFAULT_INDEX_PATH,
    embedModel: config.embedModel ?? DEFAULT_EMBED_MODEL,
    apiKey: config.apiKey ?? process.env.OPENAI_API_KEY,
  };
}

export function createVectorStoreEmbeddings(
  config: VectorStoreConfig = {}
): { embeddings: OpenAIEmbeddings; resolved: ResolvedVectorStoreConfig } {
  const resolved = resolveVectorStoreConfig(config);
  const embeddings = new OpenAIEmbeddings({
    model: resolved.embedModel,
    apiKey: resolved.apiKey,
  });
  return { embeddings, resolved };
}

export async function embedQuery(
  query: string,
  config: VectorStoreConfig = {}
): Promise<{ embedding: number[]; resolved: ResolvedVectorStoreConfig }> {
  const { embeddings, resolved } = createVectorStoreEmbeddings(config);
  const embedding = await embeddings.embedQuery(query);
  return { embedding, resolved };
}

function chunkToDoc(chunk: EmbeddedChunk): Document {
  return new Document({
    pageContent: chunk.content,
    metadata: {
      chunkId: chunk.id,
      docId: chunk.docId,
      title: chunk.title,
      chunkIndex: chunk.chunkIndex,
      section: chunk.section,
      sourcePath: chunk.sourcePath,
      updatedAt: chunk.updatedAt,
    },
  });
}

async function getStore(
  config: VectorStoreConfig = {},
  seed?: EmbeddedChunk
): Promise<{ store: FaissStore; resolved: ResolvedVectorStoreConfig }> {
  const { embeddings, resolved } = createVectorStoreEmbeddings(config);

  try {
    const store = await FaissStore.load(resolved.indexPath, embeddings);
    return { store, resolved };
  } catch (error) {
    if (!seed) {
      const reason = error instanceof Error ? error.message : "unknown error";
      throw new Error(
        `Failed to load FAISS index at "${resolved.indexPath}": ${reason}. Ingest docs before searching.`
      );
    }

    await mkdir(resolved.indexPath, { recursive: true });
    const docs = [chunkToDoc(seed)];
    const store = await FaissStore.fromDocuments(docs, embeddings);
    await store.save(resolved.indexPath);
    return { store, resolved };
  }
}

export async function upsertChunks(
  chunks: EmbeddedChunk[],
  config: VectorStoreConfig = {}
): Promise<void> {
  if (!chunks.length) return;

  const { store, resolved } = await getStore(config, chunks[0]);
  const docs = chunks.map(chunkToDoc);
  const vectors = chunks.map((c) => c.embedding);

  await store.addVectors(vectors, docs);
  await store.save(resolved.indexPath);
}

export async function similaritySearch(
  queryEmbedding: number[],
  k = 5,
  config: VectorStoreConfig = {}
): Promise<VectorSearchResult[]> {
  const { store } = await getStore(config);
  const results = await store.similaritySearchVectorWithScore(queryEmbedding, k);

  return results.map(([doc, score]) => {
    const meta = doc.metadata as Record<string, any>;
    const chunk: Omit<EmbeddedChunk, "embedding"> = {
      id: meta.chunkId ?? meta.id ?? "unknown",
      docId: meta.docId,
      title: meta.title ?? meta.section ?? meta.docId ?? "Untitled",
      content: doc.pageContent,
      chunkIndex: meta.chunkIndex,
      sourcePath: meta.sourcePath,
      section: meta.section,
      updatedAt: meta.updatedAt,
    };
    return { chunk, score: typeof score === "number" ? score : 0 };
  });
}

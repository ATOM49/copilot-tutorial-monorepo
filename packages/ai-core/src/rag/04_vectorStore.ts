import path from "node:path";
import { Document } from "@langchain/core/documents";
import { LanceDB } from "@langchain/community/vectorstores/lancedb";
import { OpenAIEmbeddings } from "@langchain/openai";
import type { EmbeddedChunk } from "./03_embedder.js";

export type LanceConfig = {
  dbPath?: string;
  tableName?: string;
  embedModel?: string;
  apiKey?: string;
};

export type VectorSearchResult = {
  chunk: Omit<EmbeddedChunk, "embedding">;
  score: number;
};

const DEFAULT_DB_PATH = path.resolve(process.cwd(), ".lancedb/docs");
const DEFAULT_TABLE = "doc_chunks";
const DEFAULT_EMBED_MODEL = "text-embedding-3-small";

function chunkToDoc(chunk: EmbeddedChunk): Document {
  return new Document({
    pageContent: chunk.content,
    metadata: {
      chunkId: chunk.id,
      docId: chunk.docId,
      chunkIndex: chunk.chunkIndex,
      section: chunk.section,
      sourcePath: chunk.sourcePath,
      updatedAt: chunk.updatedAt,
    },
  });
}

function buildEmbeddings(config: LanceConfig): OpenAIEmbeddings {
  return new OpenAIEmbeddings({
    model: config.embedModel ?? DEFAULT_EMBED_MODEL,
    apiKey: config.apiKey ?? process.env.OPENAI_API_KEY,
  });
}

async function getStore(
  config: LanceConfig,
  seed?: EmbeddedChunk
): Promise<LanceDB> {
  const embeddings = buildEmbeddings(config);
  const tableName = config.tableName ?? DEFAULT_TABLE;
  const dbPath = config.dbPath ?? DEFAULT_DB_PATH;
  try {
    // Open an existing table; LanceDB constructor will connect if it exists
    return new LanceDB(embeddings, {
      uri: dbPath,
      tableName,
    });
  } catch (error) {
    // If the table does not exist yet, seed it with the first chunk
    if (!seed) throw error;
    const docs = [chunkToDoc(seed)];
    return LanceDB.fromDocuments(docs, embeddings, {
      uri: dbPath,
      tableName,
      mode: "create",
    });
  }
}

export async function upsertChunks(
  chunks: EmbeddedChunk[],
  config: LanceConfig = {}
): Promise<void> {
  if (!chunks.length) return;

  const store = await getStore(config, chunks[0]);
  const docs = chunks.map(chunkToDoc);
  const vectors = chunks.map((c) => c.embedding);

  await store.addVectors(vectors, docs);
}

export async function similaritySearch(
  queryEmbedding: number[],
  k = 5,
  config: LanceConfig = {}
): Promise<VectorSearchResult[]> {
  const store = await getStore(config);
  const results = await store.similaritySearchVectorWithScore(queryEmbedding, k);

  return results.map(([doc, score]) => {
    const meta = doc.metadata as Record<string, any>;
    const chunk: Omit<EmbeddedChunk, "embedding"> = {
      id: meta.chunkId ?? meta.id ?? "unknown",
      docId: meta.docId,
      content: doc.pageContent,
      chunkIndex: meta.chunkIndex,
      sourcePath: meta.sourcePath,
      section: meta.section,
      updatedAt: meta.updatedAt,
    };
    return { chunk, score: typeof score === "number" ? score : 0 };
  });
}

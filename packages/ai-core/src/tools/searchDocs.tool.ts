import { z } from "zod";
import type { ToolDefinition, ToolContext } from "./ToolDefinition.js";
import {
  embedQuery,
  similaritySearch,
  type VectorStoreConfig,
} from "../rag/04_vectorStore.js";
import { ingestLocalDocs } from "../rag/05_ingest.js";

const SNIPPET_LENGTH = 320;

export const SearchDocsInputSchema = z.object({
  query: z.string().min(1, "Query is required"),
  limit: z.number().int().min(1).max(20).default(3),
  vectorStore: z
    .object({
      indexPath: z.string().optional(),
      embedModel: z.string().optional(),
      apiKey: z.string().optional(),
    })
    .partial()
    .optional(),
});

export const SearchDocsOutputSchema = z.object({
  results: z.array(
    z.object({
      docId: z.string(),
      chunkId: z.string(),
      title: z.string(),
      snippet: z.string(),
      score: z.number(),
    })
  ),
  query: z.string(),
  count: z.number(),
});

export type SearchDocsInput = z.infer<typeof SearchDocsInputSchema>;
export type SearchDocsOutput = z.infer<typeof SearchDocsOutputSchema>;

function summarizeSnippet(text: string): string {
  const condensed = text.replace(/\s+/g, " ").trim();
  if (condensed.length <= SNIPPET_LENGTH) {
    return condensed;
  }
  return `${condensed.slice(0, SNIPPET_LENGTH).trimEnd()}…`;
}

export const searchDocsTool: ToolDefinition<
  typeof SearchDocsInputSchema,
  typeof SearchDocsOutputSchema
> = {
  id: "search-docs",
  name: "Search Documentation",
  description: "Search the ingested platform docs via FAISS similarity search.",
  inputSchema: SearchDocsInputSchema,
  permissions: {
    requiredRoles: ["admin"],
    allowedTenants: ["dev-tenant"],
  },

  async run(
    input: SearchDocsInput,
    _context: ToolContext
  ): Promise<SearchDocsOutput> {
    const query = input.query.trim();
    if (!query) {
      throw new Error("Query is required");
    }

    const vectorStoreConfig: VectorStoreConfig | undefined = input.vectorStore;

    const executeSearch = async () => {
      const { embedding, resolved } = await embedQuery(query, vectorStoreConfig);
      const matches = await similaritySearch(embedding, input.limit, resolved);
      return matches.map(({ chunk, score }) => ({
        docId: chunk.docId,
        chunkId: chunk.id,
        title: chunk.title ?? chunk.section ?? chunk.docId,
        snippet: summarizeSnippet(chunk.content),
        score,
      }));
    };

    let results;
    try {
      results = await executeSearch();
    } catch (error) {
      const shouldRetry =
        error instanceof Error &&
        error.message.includes("Failed to load FAISS index");

      if (!shouldRetry) {
        const reason = error instanceof Error ? error.message : "unknown error";
        throw new Error(`Documentation search failed: ${reason}`);
      }

      // Automatically ingest docs to seed the vector store, then retry once
      await ingestLocalDocs({ vectorStore: vectorStoreConfig });
      results = await executeSearch();
    }

    return {
      results,
      query,
      count: results.length,
    };
  },
};

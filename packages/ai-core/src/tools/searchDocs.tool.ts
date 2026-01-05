import { z } from "zod/v3";
import type { ToolDefinition, ToolContext } from "./ToolDefinition.js";

/**
 * Input schema for searchDocs tool
 */
export const SearchDocsInputSchema = z.object({
  query: z.string().min(1, "Query is required"),
  limit: z.number().int().min(1).max(20).default(5),
});

/**
 * Output schema for searchDocs tool
 */
export const SearchDocsOutputSchema = z.object({
  results: z.array(
    z.object({
      id: z.string(),
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

/**
 * Search Docs Tool (stub)
 * Searches documentation for relevant content
 * Currently returns mock results; will be wired to RAG system in later days
 */
export const searchDocsTool: ToolDefinition<
  typeof SearchDocsInputSchema,
  typeof SearchDocsOutputSchema
> = {
  id: "search-docs",
  name: "Search Documentation",
  inputSchema: SearchDocsInputSchema,
  permissions: {
    requiredRoles: ["admin"],
    allowedTenants: ["dev-tenant"],
  },

  async run(
    input: SearchDocsInput,
    _context: ToolContext
  ): Promise<SearchDocsOutput> {
    // Stub implementation - return mock results for now
    // Real implementation will query a vector store
    const mockResults = [
      {
        id: "doc-1",
        title: "Getting Started with the Platform",
        snippet: `Learn the basics of the Copilot platform. This guide covers workspace setup, 
          authentication, and running your first agent...`,
        score: 0.92,
      },
      {
        id: "doc-2",
        title: "Agent Definition Guide",
        snippet: `Agents are the core abstraction. Each agent has an id, name, input schema, 
          output schema, and a run function that processes requests...`,
        score: 0.88,
      },
      {
        id: "doc-3",
        title: "Tool Registry and Safety",
        snippet: `Tools are reusable utilities that agents can call. The ToolRegistry manages 
          registration and per-agent allowlisting for security...`,
        score: 0.85,
      },
    ];

    // Filter based on query relevance (simple substring match for stub)
    const filtered = mockResults.filter(
      (r) =>
        r.title.toLowerCase().includes(input.query.toLowerCase()) ||
        r.snippet.toLowerCase().includes(input.query.toLowerCase())
    );

    const results = (
      filtered.length > 0 ? filtered : mockResults
    ).slice(0, input.limit);

    return {
      results,
      query: input.query,
      count: results.length,
    };
  },
};

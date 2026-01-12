import { z } from "zod";
import type { BaseMessage } from "@langchain/core/messages";
import type { AgentContext } from "./AgentDefinition.js";
import { BaseAgent } from "./BaseAgent.js";
import { searchDocsTool } from "../tools/searchDocs.tool.js";

const AGENT_ID = "monorepo-rag";

const MonorepoAgentInputSchema = z.object({
  question: z.string().min(1, "Question is required"),
  limit: z.number().int().min(1).max(10).optional(),
});

const MonorepoAgentCitationSchema = z.object({
  docId: z.string(),
  chunkId: z.string(),
  snippet: z.string(),
});

const MonorepoAgentOutputSchema = z.object({
  answer: z.string(),
  citations: z.array(MonorepoAgentCitationSchema),
  confidence: z.number().min(0).max(1).describe("Confidence score between 0 and 1, where 1 is highest confidence"),
});

const AnswerSchema = z.object({
  answer: z.string(),
  confidence: z.number().min(0).max(1).describe("Confidence score between 0 and 1 based on the quality and relevance of the retrieved documentation"),
});

export type MonorepoAgentInput = z.infer<typeof MonorepoAgentInputSchema>;
export type MonorepoAgentOutput = z.infer<typeof MonorepoAgentOutputSchema>;

class MonorepoAgent extends BaseAgent<
  typeof MonorepoAgentInputSchema,
  typeof MonorepoAgentOutputSchema
> {
  constructor() {
    super({
      id: AGENT_ID,
      name: "Monorepo RAG Copilot",
      inputSchema: MonorepoAgentInputSchema,
      outputSchema: MonorepoAgentOutputSchema,
    });
  }

  protected shouldUseToolLoop(): boolean {
    return true;
  }

  protected getModelOptions() {
    return { temperature: 0 };
  }

  protected buildSystemPrompt(input: MonorepoAgentInput): string {
    const limit = input.limit ?? 5;
    return [
      "You are the Monorepo Documentation Copilot.",
      "You have access to a search-docs tool to find relevant documentation.",
      "",
      "MANDATORY TOOL USAGE:",
      "You MUST call the search-docs tool FIRST before providing any answer.",
      `Call search-docs with query="${input.question}" and limit=${limit}.`,
      "Wait for the tool results before formulating your response.",
      "Do NOT attempt to answer the question without first retrieving documentation.",
      "",
      "IMPORTANT GROUNDING RULES:",
      "1. Base your answer ONLY on information from the retrieved documentation chunks.",
      "2. Do NOT fabricate, infer, or add information not present in the search results.",
      "3. Always cite sources using the format [docId#chunkId] for every claim you make.",
      "4. If the retrieved documentation doesn't contain enough information to answer the question, explicitly state what's missing and what you found instead.",
      "5. If the search results are empty or irrelevant, say so clearly rather than attempting to answer from general knowledge.",
      "",
      "CONFIDENCE SCORING:",
      "Provide a confidence score (0-1) based on:",
      "- How directly the retrieved docs answer the question (1.0 = perfect match, 0.5 = partial, 0.0 = no relevant info)",
      "- The completeness of the information found",
      "- The quality and clarity of the source material",
      "",
      "Your role is to be a reliable documentation assistant, not a general knowledge chatbot.",
    ].join("\n\n");
  }

  protected buildUserInput(input: MonorepoAgentInput): string {
    return input.question;
  }

  protected async handleMessages(
    args: {
      messages: BaseMessage[];
      context: AgentContext;
      model: any;
      input: MonorepoAgentInput;
    },
    _source: "tool" | "prompt"
  ): Promise<MonorepoAgentOutput> {
    const { messages, context, model, input } = args;
    const { citations, toolWasCalled } = this.extractCitations(messages);

    if (!toolWasCalled) {
      throw new Error(
        "Agent did not use the search-docs tool as required. The agent must retrieve documentation before answering."
      );
    }

    const { answer, confidence } = await this.runStructuredExtraction({
      schema: AnswerSchema as any,
      messages,
      model,
      context,
      input,
      strict: false,
    });

    return {
      answer,
      citations,
      confidence,
    };
  }

  private extractCitations(conversation: BaseMessage[]): {
    citations: Array<{ docId: string; chunkId: string; snippet: string }>;
    toolWasCalled: boolean;
  } {
    const citations: Array<{ docId: string; chunkId: string; snippet: string }> = [];
    let toolWasCalled = false;

    for (const msg of conversation) {
      if (msg._getType() === "tool" && (msg as any).content) {
        toolWasCalled = true;
        try {
          const rawContent = (msg as any).content;
          const toolResult =
            typeof rawContent === "string" ? JSON.parse(rawContent) : rawContent;

          if (toolResult?.results && Array.isArray(toolResult.results)) {
            for (const result of toolResult.results) {
              if (result.docId && result.chunkId && result.snippet) {
                citations.push({
                  docId: result.docId,
                  chunkId: result.chunkId,
                  snippet: result.snippet,
                });
              }
            }
          }
        } catch {
          // Ignore parsing errors
        }
      }
    }

    return { citations, toolWasCalled };
  }
}

export const monorepoAgent = new MonorepoAgent();

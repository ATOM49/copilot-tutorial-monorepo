import type { FastifyPluginAsync } from "fastify";
import { ingestLocalDocs } from "@copilot/ai-core";

export const ragRoutes: FastifyPluginAsync = async (app) => {
  app.post("/copilot/rag/ingest", async (req) => {
    const stats = await ingestLocalDocs();
    req.log.info(
      {
        docs: stats.docs,
        chunks: stats.chunks,
        indexPath: stats.indexPath,
        durationMs: stats.durationMs,
      },
      "Completed documentation ingestion"
    );

    return {
      ok: true as const,
      stats,
    };
  });
};

"use client";

import { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ingestDocs, type IngestDocsResponse } from "@/lib/api/agents";

const STATUS_CONFIG = {
  idle: { label: "Awaiting run", variant: "outline" as const },
  running: { label: "Ingesting…", variant: "secondary" as const },
  success: { label: "Ready", variant: "default" as const },
  error: { label: "Needs attention", variant: "destructive" as const },
};

type StatusKey = keyof typeof STATUS_CONFIG;

export function DayCard() {
  const [status, setStatus] = useState<StatusKey>("idle");
  const [stats, setStats] = useState<IngestDocsResponse["stats"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);

  const statusMeta = STATUS_CONFIG[status];

  const handleIngest = useCallback(async () => {
    setStatus("running");
    setError(null);
    try {
      const response = await ingestDocs();
      setStats(response.stats);
      setLastRunAt(new Date().toLocaleTimeString());
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ingest docs");
      setStatus("error");
    }
  }, []);

  const durationSeconds = useMemo(() => {
    if (!stats) return null;
    return (stats.durationMs / 1000).toFixed(1);
  }, [stats]);

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle>Day 10 · RAG Ingestion</CardTitle>
        <p className="text-sm text-muted-foreground">
          Wire the LangChain FAISS vector store into the docs search tool and surface
          a one-click ingestion trigger so we can rebuild the index as docs evolve.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleIngest} disabled={status === "running"}>
            {status === "running" ? "Building index…" : "Ingest documentation"}
          </Button>
          <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
          {lastRunAt && (
            <span className="text-xs text-muted-foreground">
              Last run at {lastRunAt}
            </span>
          )}
        </div>

        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
          {stats ? (
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Documents</dt>
                <dd className="text-2xl font-semibold">{stats.docs}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Chunks embedded</dt>
                <dd className="text-2xl font-semibold">{stats.chunks}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Vectors stored</dt>
                <dd className="text-2xl font-semibold">{stats.embeddings}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Index duration</dt>
                <dd className="text-2xl font-semibold">
                  {durationSeconds ? `${durationSeconds}s` : "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Index location</dt>
                <dd className="mt-1 truncate rounded-md bg-background/70 px-3 py-2 font-mono text-xs">
                  {stats.indexPath}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              Kick off an ingestion run to populate the FAISS index from the local markdown docs.
            </p>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

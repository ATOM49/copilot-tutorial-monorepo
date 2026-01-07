"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export type MonorepoMessage = {
  id: string;
  from: "user" | "copilot";
  label: string;
  time: string;
  text?: string;
  answer?: string;
  citations?: Array<{
    docId: string;
    chunkId: string;
    snippet: string;
  }>;
  confidence?: number;
};

export function MonorepoChatBubble({ message }: { message: MonorepoMessage }) {
  const isUser = message.from === "user";

  return (
    <div
      role="listitem"
      className={cn(
        "flex flex-col gap-2 rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-sm transition",
        isUser
          ? "self-end border-transparent bg-primary text-primary-foreground"
          : "self-start border-slate-200 bg-card text-card-foreground",
        "dark:border-slate-800 dark:bg-slate-900"
      )}
    >
      {/* Header with label and time */}
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        <span>{message.label}</span>
        <span className="text-[0.5rem] uppercase tracking-[0.7em] text-muted-foreground/70">
          {message.time}
        </span>
      </div>

      {/* User message or status text */}
      {(message.text || isUser) && (
        <p className={cn(isUser && "text-primary-foreground")}>
          {message.text}
        </p>
      )}

      {/* Copilot answer */}
      {!isUser && message.answer && (
        <div className="space-y-3">
          <p className="whitespace-pre-wrap">{message.answer}</p>

          {/* Confidence score */}
          {typeof message.confidence === "number" && (
            <div className="space-y-1 rounded-lg bg-slate-50 p-3 dark:bg-slate-950/50">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">
                  Confidence
                </span>
                <span className="font-semibold">
                  {Math.round(message.confidence * 100)}%
                </span>
              </div>
              <Progress value={message.confidence * 100} className="h-1.5" />
            </div>
          )}

          {/* Citations */}
          {message.citations && message.citations.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Sources
                </span>
                <Badge variant="secondary" className="h-5 text-[10px]">
                  {message.citations.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {message.citations.map((citation, idx) => (
                  <div
                    key={`${citation.docId}-${citation.chunkId}-${idx}`}
                    className="rounded-md border border-slate-200 bg-slate-50/50 p-2 dark:border-slate-800 dark:bg-slate-900/30"
                  >
                    <div className="mb-1 flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                      <Badge variant="outline" className="h-4 px-1 text-[9px]">
                        {idx + 1}
                      </Badge>
                      <span className="truncate">
                        {citation.docId}#{citation.chunkId}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
                      {citation.snippet}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

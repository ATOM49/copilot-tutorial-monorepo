"use client";

import type { ChatMessage } from "@/components/chat/ChatList";
import { StreamingToolChat } from "@/components/chat/StreamingToolChat";
import { MonorepoChatBubble, type MonorepoMessage } from "@/components/chat/MonorepoChatBubble";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const MONOREPO_AGENT_ID = "monorepo-rag";

const toMonorepoMessage = (message: ChatMessage): MonorepoMessage => {
  const base: MonorepoMessage = {
    id: message.id,
    from: message.from,
    label: message.label,
    time: message.time,
    text: message.text,
  };

  if (message.from === "copilot") {
    const payload = (message.jsonData ?? {}) as Partial<MonorepoMessage>;
    if (typeof payload.answer === "string") {
      base.answer = payload.answer;
    }
    if (Array.isArray(payload.citations)) {
      base.citations = payload.citations;
    }
    if (typeof payload.confidence === "number") {
      base.confidence = payload.confidence;
    }
  }

  return base;
};

export function DayCard() {
  return (
    <Card className="overflow-hidden border border-slate-200/70 dark:border-slate-800/70">
      <CardHeader className="px-6 pb-4 pt-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">
            Day 12 · Monorepo RAG Assistant
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            RAG
          </Badge>
        </div>
        <CardDescription>
          Ask questions about this monorepo&apos;s documentation. The agent uses
          RAG to search through platform overviews and retrieval guides,
          providing answers with citations and confidence scores.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 px-6 pb-6 pt-0">
        <StreamingToolChat
          title="Monorepo Documentation Assistant"
          selectedAgent={MONOREPO_AGENT_ID}
          placeholder="Ask about the monorepo..."
          renderMessage={(message) => (
            <MonorepoChatBubble message={toMonorepoMessage(message)} />
          )}
        />

        <Separator />

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900/30">
          <p className="text-xs text-muted-foreground">
            <strong>RAG Architecture:</strong> This agent retrieves relevant
            documentation chunks using vector search, then generates grounded
            answers with citations. Confidence scores reflect how well the
            retrieved docs match your question.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

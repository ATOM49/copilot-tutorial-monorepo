"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChatPreview } from "./ChatPreview";

export function DayCard() {
  return (
    <Card className="overflow-hidden border border-slate-200/70 dark:border-slate-800/70">
      <CardHeader className="px-6 pb-4 pt-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">Day 5 · Copilot Panel</CardTitle>
        </div>
        <CardDescription>
          Build the chat-like container first: message list, typing bar, and a
          sense of flow before hooking up agents.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-6 pb-6 pt-0">
        <ChatPreview />
      </CardContent>
    </Card>
  );
}

"use client";

import { cn } from "@/lib/utils";

export type ChatMessage = {
  id: string;
  from: "user" | "copilot";
  label: string;
  text: string;
  time: string;
};

export function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.from === "user";

  return (
    <div
      role="listitem"
      className={cn(
        "flex flex-col gap-1 rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-sm transition",
        isUser
          ? "self-end border-transparent bg-primary text-primary-foreground"
          : "self-start border-slate-200 bg-card text-card-foreground",
        "dark:border-slate-800 dark:bg-slate-900"
      )}
    >
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        <span>{message.label}</span>
        <span className="text-[0.5rem] uppercase tracking-[0.7em] text-muted-foreground/70">{message.time}</span>
      </div>
      <p>{message.text}</p>
    </div>
  );
}
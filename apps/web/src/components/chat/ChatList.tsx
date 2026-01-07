"use client";

import type { ReactNode } from "react";
import { ChatBubble } from "./ChatBubble";

export interface ChatMessage {
  id: string;
  from: "user" | "copilot";
  label: string;
  text: string;
  time: string;
  jsonData?: unknown;
}

function JsonDisplay({ data }: { data: unknown }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-2 text-xs">
      <code>{JSON.stringify(data, null, 2)}</code>
    </pre>
  );
}

interface ChatListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  renderMessage?: (message: ChatMessage) => ReactNode;
}

export function ChatList({ messages, isLoading, renderMessage }: ChatListProps) {
  return (
    <div
      role="list"
      aria-label="Chat messages"
      className="flex flex-col gap-3 overflow-y-auto"
    >
      {messages.length === 0 && !isLoading ? (
        <div className="text-sm text-muted-foreground">Start chatting to see messages...</div>
      ) : (
        <>
          {messages.map((message) => {
            const bubble = renderMessage ? (
              renderMessage(message)
            ) : (
              <ChatBubble message={message} />
            );

            return (
              <div key={message.id}>
                {bubble}
                {!renderMessage && message.jsonData && (
                  <JsonDisplay data={message.jsonData} />
                )}
              </div>
            );
          })}
          {isLoading && (
            <div className="text-sm text-muted-foreground">Copilot is thinking...</div>
          )}
        </>
      )}
    </div>
  );
}
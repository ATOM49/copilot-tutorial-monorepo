"use client";

import { ChatBubble } from "./ChatBubble";

export interface ChatMessage {
  id: string;
  from: "user" | "copilot";
  label: string;
  text: string;
  time: string;
  jsonData?: any;
}

function JsonDisplay({ data }: { data: any }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-2 text-xs">
      <code>{JSON.stringify(data, null, 2)}</code>
    </pre>
  );
}

export function ChatList({ messages, isLoading }: { messages: ChatMessage[]; isLoading?: boolean }) {
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
          {messages.map((message) => (
            <div key={message.id}>
              <ChatBubble message={message} />
              {message.jsonData && <JsonDisplay data={message.jsonData} />}
            </div>
          ))}
          {isLoading && (
            <div className="text-sm text-muted-foreground">Copilot is thinking...</div>
          )}
        </>
      )}
    </div>
  );
}
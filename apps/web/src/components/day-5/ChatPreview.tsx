"use client";

import { useState } from "react";
import { ChatList, ChatMessage } from "./ChatList";
import { ChatInput } from "./ChatInput";
import AgentSelector from "./AgentSelector";
import { runAgent } from "@/lib/api/agents";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function ChatPreview() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>("");

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !selectedAgent) return;

    // Add user message to history
    const userMessage: ChatMessage = {
      id: `m-${Date.now()}`,
      from: "user",
      label: "You",
      text,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const data = await runAgent(selectedAgent, { question: text }, apiBase);

      // Add AI response with formatted JSON
      const aiMessage: ChatMessage = {
        id: `m-${Date.now()}-ai`,
        from: "copilot",
        label: "Copilot",
        text: "",
        jsonData: data?.result,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `m-${Date.now()}-err`,
        from: "copilot",
        label: "Copilot",
        text: `Error: ${String(error)}`,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Chat Preview
      </div>
      <AgentSelector onSelect={setSelectedAgent} />
      <ChatList messages={messages} isLoading={loading} />
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={loading || !selectedAgent}
        placeholder={selectedAgent ? "Ask Copilot..." : "Select an agent first"}
      />
    </div>
  );
}

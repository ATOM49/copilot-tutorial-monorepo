"use client";

import { useRef, useState } from "react";
import { ChatList, ChatMessage } from "./ChatList";
import { ChatInput } from "./ChatInput";
import AgentSelector from "./AgentSelector";
import { runAgent } from "@/lib/api/agents";
import { Button } from "@/components/ui/button";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function ChatPreview() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);

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

    // Create AbortController for this request so it can be cancelled
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const data = await runAgent(selectedAgent, { question: text }, apiBase, controller.signal);

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
      const aborted = (error as any)?.name === "AbortError" || String(error).includes("aborted");
      const errorMessage: ChatMessage = {
        id: `m-${Date.now()}-err`,
        from: "copilot",
        label: "Copilot",
        text: aborted ? "Request cancelled" : `Error: ${String(error)}`,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Chat Preview
      </div>
      <AgentSelector onSelect={setSelectedAgent} />
      <ChatList messages={messages} isLoading={loading} />
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={loading || !selectedAgent}
            placeholder={selectedAgent ? "Ask Copilot..." : "Select an agent first"}
          />
        </div>
        {loading && (
          <Button
            variant="ghost"
            onClick={() => {
              abortRef.current?.abort();
            }}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

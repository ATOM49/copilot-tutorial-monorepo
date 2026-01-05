"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AgentSelector from "@/components/day-5/AgentSelector";
import { ChatList, type ChatMessage } from "@/components/day-5/ChatList";
import { ChatInput } from "@/components/day-5/ChatInput";
import { runAgentStream } from "@/lib/api/agents";

export function DayCard() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const stopRef = useRef<() => void>(() => {});

  useEffect(() => {
    return () => {
      // cleanup streaming on unmount
      try {
        stopRef.current();
      } catch {}
    };
  }, []);

  const handleSend = async (text: string) => {
    if (!text.trim() || !selectedAgent) return;

    const userMessage: ChatMessage = {
      id: `m-${Date.now()}`,
      from: "user",
      label: "You",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    // create placeholder AI message
    const aiId = `m-${Date.now()}-ai`;
    const aiMessage: ChatMessage = {
      id: aiId,
      from: "copilot",
      label: "Copilot",
      text: "",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, aiMessage]);

    // Start streaming
    const stop = await runAgentStream(
      selectedAgent,
      { question: text },
      (event, data) => {
        if (event === "status") {
          // status may be started/completed
          const status = data?.status ?? data;
          setMessages((prev) =>
            prev.map((m) => (m.id === aiId ? { ...m, text: status === "started" ? "thinking..." : m.text } : m))
          );
        } else if (event === "result") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiId ? { ...m, jsonData: data?.result ?? data, text: "" } : m
            )
          );
        } else if (event === "error") {
          setMessages((prev) =>
            prev.map((m) => (m.id === aiId ? { ...m, text: `Error: ${data?.error ?? String(data)}` } : m))
          );
          setLoading(false);
        } else if (event === "done") {
          setLoading(false);
        }
      }
    );

    // store stop function so we can cancel if needed
    stopRef.current = stop;
  };

  const handleCancel = () => {
    try {
      stopRef.current();
    } catch {}
    stopRef.current = () => {};
    setLoading(false);

    const cancelMessage = {
      id: `m-cancel-${Date.now()}`,
      from: "copilot",
      label: "Copilot",
      text: "Cancelled",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    } as ChatMessage;

    setMessages((prev) => [...prev, cancelMessage]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Day 6 — Streaming Agent</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Live Stream Chat
          </div>
          <AgentSelector onSelect={setSelectedAgent} />
          <div className="h-64 overflow-auto">
            <ChatList messages={messages} isLoading={loading} />
          </div>

          <div className="flex items-center gap-2 w-full">
            <ChatInput
              onSendMessage={async (t) => await handleSend(t)}
              disabled={loading || !selectedAgent}
              placeholder={selectedAgent ? "Ask Copilot (stream)..." : "Select an agent first"}
            />
            {loading && (
              <Button variant="destructive" onClick={handleCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

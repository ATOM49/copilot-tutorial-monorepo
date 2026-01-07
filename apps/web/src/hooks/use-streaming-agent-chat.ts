import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/components/chat/ChatList";
import {
  formatTimelineDetail,
  type TimelineEvent,
} from "@/components/chat/EventTimeline";
import { runAgentStream } from "@/lib/api/agents";

interface UseStreamingAgentChatResult {
  messages: ChatMessage[];
  timeline: TimelineEvent[];
  loading: boolean;
  sendMessage: (text: string) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

export function useStreamingAgentChat(
  selectedAgent?: string
): UseStreamingAgentChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (stopRef.current) {
        try {
          stopRef.current();
        } catch {}
      }
    };
  }, []);

  const recordEvent = useCallback((event: string, data: unknown) => {
    const entry: TimelineEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      event,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      detail: formatTimelineDetail(data),
    };

    setTimeline((prev) => [entry, ...prev].slice(0, 20));
  }, []);

  const reset = useCallback(() => {
    if (stopRef.current) {
      try {
        stopRef.current();
      } catch {}
      stopRef.current = null;
    }
    setMessages([]);
    setTimeline([]);
    setLoading(false);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !selectedAgent) return;

      if (stopRef.current) {
        try {
          stopRef.current();
        } catch {}
        stopRef.current = null;
      }

      const now = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const userMessage: ChatMessage = {
        id: `m-${Date.now()}`,
        from: "user",
        label: "You",
        text,
        time: now,
      };
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      const aiId = `m-${Date.now()}-ai`;
      const aiMessage: ChatMessage = {
        id: aiId,
        from: "copilot",
        label: "Copilot",
        text: "thinking...",
        time: now,
      };
      setMessages((prev) => [...prev, aiMessage]);

      recordEvent("request", { agentId: selectedAgent, question: text });

      try {
        const stop = await runAgentStream(
          selectedAgent,
          { question: text },
          (event, data) => {
            recordEvent(event, data);

            if (event === "status") {
              const status = typeof data === "string" ? data : data?.status;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiId
                    ? {
                        ...m,
                        text:
                          status === "started"
                            ? "thinking..."
                            : status ?? m.text,
                      }
                    : m
                )
              );
            } else if (event === "result") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiId
                    ? { ...m, jsonData: data?.result ?? data, text: "" }
                    : m
                )
              );
            } else if (event === "error") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiId
                    ? { ...m, text: `Error: ${data?.error ?? String(data)}` }
                    : m
                )
              );
              setLoading(false);
              stopRef.current = null;
            } else if (event === "done") {
              setLoading(false);
              stopRef.current = null;
            }
          }
        );

        stopRef.current = stop;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        recordEvent("error", { error: message });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiId ? { ...m, text: `Error: ${message}` } : m
          )
        );
        setLoading(false);
        stopRef.current = null;
      }
    },
    [recordEvent, selectedAgent]
  );

  const cancel = useCallback(() => {
    if (stopRef.current) {
      try {
        stopRef.current();
      } catch {}
      stopRef.current = null;
    }

    if (!messages.length) return;

    setLoading(false);
    const cancelMessage: ChatMessage = {
      id: `m-cancel-${Date.now()}`,
      from: "copilot",
      label: "Copilot",
      text: "Cancelled",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, cancelMessage]);
    recordEvent("cancelled", { reason: "User cancelled the request" });
  }, [messages.length, recordEvent]);

  return {
    messages,
    timeline,
    loading,
    sendMessage,
    cancel,
    reset,
  };
}

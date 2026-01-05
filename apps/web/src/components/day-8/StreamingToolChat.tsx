"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AgentSelector from "@/components/day-5/AgentSelector";
import { ChatInput } from "@/components/day-5/ChatInput";
import { ChatList, type ChatMessage } from "@/components/day-5/ChatList";
import { Button } from "@/components/ui/button";
import { runAgentStream } from "@/lib/api/agents";

interface TimelineEvent {
  id: string;
  event: string;
  time: string;
  detail?: string;
}

const formatDetail = (data: unknown): string | undefined => {
  if (data == null || data === "") return undefined;
  if (typeof data === "string") return data;
  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
};

export function StreamingToolChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const stopRef = useRef<(() => void) | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNewIndicator, setShowNewIndicator] = useState(false);
  const previousMessageCountRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const schedule = useCallback((cb: () => void) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      try {
        cb();
      } catch {}
    });
  }, []);

  const dismissNewIndicator = useCallback(() => setShowNewIndicator(false), []);

  useEffect(() => {
    return () => {
      if (stopRef.current) {
        try {
          stopRef.current();
        } catch {}
      }
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // Intentionally omit dismissNewIndicator from cleanup to avoid setting
    // state on unmount.
  }, []);

  const scrollToBottom = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, []);

  const handleScrollPosition = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const threshold = 40;
    const distanceFromBottom =
      container.scrollHeight - (container.scrollTop + container.clientHeight);
    setIsAtBottom(distanceFromBottom <= threshold);
  }, []);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    // Defer initial state update to avoid synchronous setState inside effect
    schedule(() => handleScrollPosition());

    container.addEventListener("scroll", handleScrollPosition);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      container.removeEventListener("scroll", handleScrollPosition);
    };
  }, [handleScrollPosition]);

  useEffect(() => {
    if (isAtBottom) {
      // Only clear the indicator if it's visible; defer to avoid
      // synchronous setState inside an effect.
      schedule(() => {
        setShowNewIndicator((prev) => (prev ? false : prev));
      });
    }
  }, [isAtBottom, schedule]);

  useEffect(() => {
    if (messages.length > previousMessageCountRef.current) {
      if (isAtBottom) {
        // Scroll immediately; clear indicator deferred.
        scrollToBottom();
        schedule(() => setShowNewIndicator(false));
      } else {
        // Defer this state update to the next animation frame.
        schedule(() => setShowNewIndicator(true));
      }
    }
    previousMessageCountRef.current = messages.length;
  }, [messages, isAtBottom, scrollToBottom, dismissNewIndicator]);

  const recordEvent = (event: string, data: unknown) => {
    const entry: TimelineEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      event,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      detail: formatDetail(data),
    };

    setTimeline((prev) => [entry, ...prev].slice(0, 20));
  };

  const handleSend = async (text: string) => {
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
                        status === "started" ? "thinking..." : status ?? m.text,
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
  };

  const handleCancel = () => {
    if (stopRef.current) {
      try {
        stopRef.current();
      } catch {}
      stopRef.current = null;
    }

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
  };

  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Streaming Agent Preview
      </div>

      <AgentSelector onSelect={setSelectedAgent} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="relative flex flex-col gap-3 rounded-lg border border-slate-200/70 bg-white p-4 dark:border-slate-800/70 dark:bg-slate-950">
          <div ref={chatContainerRef} className="h-64 overflow-auto pr-1">
            <ChatList messages={messages} isLoading={loading} />
          </div>

          {/* Floating in-chat new-message indicator */}
          {showNewIndicator && (
            <div
              role="button"
              onClick={() => {
                scrollToBottom();
                schedule(() => setShowNewIndicator(false));
              }}
              className="absolute left-1/2 bottom-16 z-20 -translate-x-1/2 transform cursor-pointer rounded-full bg-slate-900/90 px-3 py-1 text-xs font-medium text-white shadow-md hover:bg-slate-900"
            >
              New messages
            </div>
          )}

          <div className="flex items-center gap-2">
            <ChatInput
              onSendMessage={handleSend}
              disabled={loading || !selectedAgent}
              placeholder={
                selectedAgent
                  ? "Ask Copilot (tools)..."
                  : "Select an agent first"
              }
            />
            {loading && (
              <Button variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200/70 bg-slate-50 p-4 text-sm dark:border-slate-800/70 dark:bg-slate-900/30">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Event Timeline
          </div>
          <div className="mt-3 max-h-64 space-y-2 overflow-auto">
            {timeline.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No streaming events yet.
              </p>
            ) : (
              timeline.map((item) => (
                <div
                  key={item.id}
                  className="rounded-md border border-slate-100 bg-white p-2 text-xs shadow-sm dark:border-slate-800/70 dark:bg-slate-950"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium capitalize">{item.event}</span>
                    <span className="text-muted-foreground">{item.time}</span>
                  </div>
                  {item.detail && (
                    <p className="mt-1 break-words text-[11px] text-muted-foreground">
                      {item.detail}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StreamingToolChat;

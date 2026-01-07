"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatList, type ChatMessage } from "@/components/chat/ChatList";
import { EventTimeline } from "@/components/chat/EventTimeline";
import { Button } from "@/components/ui/button";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { useStreamingAgentChat } from "@/hooks/use-streaming-agent-chat";

interface StreamingToolChatProps {
  selectedAgent?: string;
  renderMessage?: (message: ChatMessage) => ReactNode;
  placeholder?: string;
  title?: string;
}

export function StreamingToolChat({
  selectedAgent,
  renderMessage,
  placeholder = "Ask Copilot (tools)...",
  title = "Streaming Agent Preview",
}: StreamingToolChatProps) {
  const { messages, timeline, loading, sendMessage, cancel, reset } =
    useStreamingAgentChat(selectedAgent);
  const { chatContainerRef, showNewIndicator, scrollToBottom, dismissNewIndicator } =
    useChatScroll(messages.length);

  const noAgentSelected = !selectedAgent;

  useEffect(() => {
    reset();
  }, [reset, selectedAgent]);

  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="relative flex flex-col gap-3 rounded-lg border border-slate-200/70 bg-white p-4 dark:border-slate-800/70 dark:bg-slate-950">
          <div ref={chatContainerRef} className="h-64 overflow-auto pr-1">
            {noAgentSelected ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Select an agent to begin chatting.
              </div>
            ) : (
              <ChatList
                messages={messages}
                isLoading={loading}
                renderMessage={renderMessage}
              />
            )}
          </div>

          {/* Floating in-chat new-message indicator */}
          {showNewIndicator && (
            <div
              role="button"
              onClick={() => {
                scrollToBottom();
                dismissNewIndicator();
              }}
              className="absolute left-1/2 bottom-16 z-20 -translate-x-1/2 transform cursor-pointer rounded-full bg-slate-900/90 px-3 py-1 text-xs font-medium text-white shadow-md hover:bg-slate-900"
            >
              New messages
            </div>
          )}

          <div className="flex items-center gap-2">
            <ChatInput
              onSendMessage={sendMessage}
              disabled={loading || noAgentSelected}
              placeholder={
                noAgentSelected ? "Select an agent first" : placeholder
              }
            />
            {loading && (
              <Button variant="ghost" onClick={cancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>

        <EventTimeline
          events={timeline}
          emptyState="No streaming events yet."
          scrollAreaClassName="max-h-64"
        />
      </div>
    </div>
  );
}

export default StreamingToolChat;

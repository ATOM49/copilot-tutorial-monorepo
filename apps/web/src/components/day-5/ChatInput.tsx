"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ChatInput({
  onSendMessage,
  disabled,
  placeholder,
}: {
  onSendMessage: (text: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending || disabled) return;

    setSending(true);
    try {
      await onSendMessage(input);
      setInput("");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        placeholder={placeholder || "Ask Copilot..."}
        aria-label="Message input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={sending || disabled}
      />
      <Button type="submit" disabled={sending || !input.trim() || disabled}>
        {sending ? "Sending..." : "Send"}
      </Button>
    </form>
  );
}
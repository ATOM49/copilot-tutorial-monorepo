import { useCallback, useEffect, useRef, useState } from "react";

interface UseChatScrollResult {
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  showNewIndicator: boolean;
  scrollToBottom: () => void;
  dismissNewIndicator: () => void;
}

/**
 * Shared scroll management for chat panes with floating new message indicators.
 */
export function useChatScroll(messageCount: number): UseChatScrollResult {
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
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

    schedule(() => handleScrollPosition());
    container.addEventListener("scroll", handleScrollPosition);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      container.removeEventListener("scroll", handleScrollPosition);
    };
  }, [handleScrollPosition, schedule]);

  useEffect(() => {
    if (isAtBottom) {
      schedule(() => {
        setShowNewIndicator((prev) => (prev ? false : prev));
      });
    }
  }, [isAtBottom, schedule]);

  useEffect(() => {
    if (messageCount > previousMessageCountRef.current) {
      if (isAtBottom) {
        scrollToBottom();
        schedule(() => setShowNewIndicator(false));
      } else {
        schedule(() => setShowNewIndicator(true));
      }
    }
    previousMessageCountRef.current = messageCount;
  }, [messageCount, isAtBottom, scrollToBottom, schedule]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const dismissNewIndicator = useCallback(() => {
    schedule(() => setShowNewIndicator(false));
  }, [schedule]);

  return {
    chatContainerRef,
    showNewIndicator,
    scrollToBottom,
    dismissNewIndicator,
  };
}

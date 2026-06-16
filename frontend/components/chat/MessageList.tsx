"use client";

import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import type { Message } from "@/types";

const SUGGESTIONS = [
  { text: "What's Jia Hwee working on right now?", delay: "[animation-delay:50ms]" },
  { text: "Tell me about his background", delay: "[animation-delay:130ms]" },
  { text: "What does he do outside of coding?", delay: "[animation-delay:210ms]" },
];

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  onSuggestion: (msg: string) => void;
}

export default function MessageList({ messages, isStreaming, onSuggestion }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const visibleMessages = messages.filter(
    (message) => message.role === "user" || message.content.trim() !== "" || message.toolEvents?.length
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (visibleMessages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-start pt-[18vh] gap-5 text-center px-6 pb-8">
        <span className="text-6xl select-none">🥬</span>
        <div className="flex flex-col gap-2">
          <p className="font-display text-foreground font-bold text-3xl tracking-tight">
            Hi, I&apos;m Wongbot!
          </p>
          <p className="text-muted text-sm max-w-xs leading-relaxed">
            Jia Hwee&apos;s AI spokesperson. Ask me anything about him.
          </p>
        </div>
        <div className="flex flex-col gap-2 mt-2 w-full max-w-sm">
          {SUGGESTIONS.map(({ text, delay }) => (
            <button
              key={text}
              onClick={() => onSuggestion(text)}
              className={`animate-chip-in ${delay} text-left w-full px-4 py-3 rounded-xl border border-border bg-surface hover:border-accent/60 hover:bg-surface-raised hover:text-foreground text-muted text-sm transition-all`}
            >
              {text}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 relative flex flex-col">
      <div className="pointer-events-none sticky bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent" />
      <div className="max-w-2xl w-full mx-auto flex flex-col gap-4 mt-auto">
        {visibleMessages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}
        {isStreaming && messages[messages.length - 1]?.role === "model" && messages[messages.length - 1]?.content === "" && (
          <div className="flex justify-start">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-surface-raised border border-border flex items-center justify-center text-sm mr-2 mt-0.5 select-none">
              🥬
            </div>
            <div className="bg-bot-bubble border border-border rounded-2xl rounded-bl-sm px-4 py-2.5">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-accent/60 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-accent/60 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-accent/60 rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import type { Message } from "@/types";

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
}

export default function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const visibleMessages = messages.filter(
    (message) => message.role === "user" || message.content.trim() !== "" || message.toolEvents?.length
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (visibleMessages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-4">
        <span className="text-5xl select-none">🥬</span>
        <p className="text-foreground font-semibold text-lg">Hi, I&apos;m Wongbot!</p>
        <p className="text-muted text-sm max-w-sm">
          Jia Hwee&apos;s AI spokesperson. Ask me anything about him — his work, projects, or just say hi lah!
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
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
                <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

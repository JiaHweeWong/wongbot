"use client";

import { useRef, type KeyboardEvent } from "react";

interface MessageInputProps {
  onSend: (message: string) => void;
  isStreaming: boolean;
}

export default function MessageInput({ onSend, isStreaming }: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSend() {
    const value = textareaRef.current?.value.trim();
    if (!value || isStreaming) return;
    textareaRef.current!.value = "";
    textareaRef.current!.style.height = "auto";
    onSend(value);
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  return (
    <div className="border-t border-border bg-surface px-4 py-4">
      <div className="max-w-2xl mx-auto flex items-end gap-3">
        <textarea
          ref={textareaRef}
          rows={1}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={isStreaming}
          placeholder="Ask me about Jia Hwee..."
          className="flex-1 resize-none bg-surface-raised border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors disabled:opacity-50 leading-relaxed"
        />
        <button
          onClick={handleSend}
          disabled={isStreaming}
          className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          aria-label="Send message"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>
      <p className="max-w-2xl mx-auto text-xs text-muted mt-2 px-1">
        Enter to send · Shift+Enter for new line · 10 messages per day
      </p>
    </div>
  );
}

"use client";

import { createContext, useContext, useState } from "react";
import type { Message } from "@/types";

interface ChatContextValue {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  summary: string;
  setSummary: React.Dispatch<React.SetStateAction<string>>;
  summarizedMessageCount: number;
  setSummarizedMessageCount: React.Dispatch<React.SetStateAction<number>>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [summary, setSummary] = useState("");
  const [summarizedMessageCount, setSummarizedMessageCount] = useState(0);

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        summary,
        setSummary,
        summarizedMessageCount,
        setSummarizedMessageCount,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatMessages() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatMessages must be used within ChatProvider");
  }

  return context;
}

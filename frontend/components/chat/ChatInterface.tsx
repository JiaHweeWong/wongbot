"use client";

import { useState } from "react";
import { streamChat } from "@/lib/api";
import type { Message } from "@/types";
import { useChatMessages } from "./ChatProvider";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

export default function ChatInterface() {
  const { messages, setMessages } = useChatMessages();
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(userMessage: string) {
    const history = messages.filter(isPersistableMessage);
    const newMessages: Message[] = [
      ...history,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);
    setIsStreaming(true);
    setError(null);

    // Add an empty bot message to stream into
    setMessages([...newMessages, { role: "model", content: "" }]);

    try {
      let accumulatedContent = "";
      const toolEvents: Message["toolEvents"] = [];
      for await (const chunk of streamChat(userMessage, history)) {
        if (chunk.type === "text") {
          accumulatedContent += chunk.content;
        } else if (chunk.type === "tool_call") {
          toolEvents.push({
            type: "call",
            id: chunk.id,
            name: chunk.name,
            input: chunk.input,
          });
        } else if (chunk.type === "tool_result") {
          toolEvents.push({
            type: "result",
            id: chunk.id,
            name: chunk.name,
            output: chunk.output,
          });
        }

        setMessages([
          ...newMessages,
          { role: "model", content: accumulatedContent, toolEvents: [...toolEvents] },
        ]);
      }

      if (!accumulatedContent.trim() && toolEvents.length === 0) {
        throw new Error("No response received. Please try again.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      // Remove the empty bot message on error
      setMessages(newMessages);
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <MessageList messages={messages} isStreaming={isStreaming} />
      {error && (
        <div className="max-w-2xl mx-auto w-full px-4 pb-2">
          <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
            {error}
          </p>
        </div>
      )}
      <MessageInput onSend={handleSend} isStreaming={isStreaming} />
    </div>
  );
}

function isPersistableMessage(message: Message): boolean {
  if (message.role === "user") return message.content.trim().length > 0;
  return message.content.trim().length > 0 || Boolean(message.toolEvents?.length);
}

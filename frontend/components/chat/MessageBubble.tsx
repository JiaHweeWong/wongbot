import type { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-surface-raised border border-border flex items-center justify-center text-sm mr-2 mt-0.5 select-none">
          🥬
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-user-bubble text-foreground rounded-br-sm"
            : "bg-bot-bubble border border-border text-foreground rounded-bl-sm"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

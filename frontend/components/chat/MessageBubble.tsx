import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const toolCalls = message.toolEvents?.filter((event) => event.type === "call") ?? [];

  return (
    <div className={`flex ${isUser ? "justify-end animate-bubble-right" : "justify-start animate-bubble-left"}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-surface-raised border border-border flex items-center justify-center text-sm mr-2 mt-0.5 select-none">
          🥬
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-user-bubble text-foreground rounded-br-sm whitespace-pre-wrap"
            : "bg-bot-bubble border border-border text-foreground rounded-bl-sm"
        }`}
      >
        {toolCalls.length > 0 && (
          <div className="mb-2 flex flex-col gap-1 whitespace-normal">
            {toolCalls.map((event) => (
              <div
                key={event.id}
                className="rounded-md border border-border bg-surface-raised px-2 py-1 text-xs text-muted"
              >
                <span className="font-medium text-foreground">Tool:</span>{" "}
                {event.name}
                <span className="ml-1 text-muted">
                  {formatToolInput(event.input)}
                </span>
              </div>
            ))}
          </div>
        )}
        {isUser ? (
          message.content
        ) : (
          <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 prose-strong:text-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function formatToolInput(input: unknown): string {
  if (
    input &&
    typeof input === "object" &&
    "input" in input &&
    typeof (input as { input?: unknown }).input === "string"
  ) {
    const rawInput = (input as { input: string }).input;
    try {
      input = JSON.parse(rawInput);
    } catch {
      input = rawInput;
    }
  }

  if (!input || (typeof input === "object" && Object.keys(input).length === 0)) {
    return "";
  }

  try {
    return JSON.stringify(input);
  } catch {
    return "";
  }
}

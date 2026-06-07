import type { ChatStreamEvent, Message } from "@/types";

export async function* streamChat(
  message: string,
  history: Message[],
  summary: string,
  summarizedMessageCount: number
): AsyncGenerator<ChatStreamEvent> {
  const response = await fetch(`/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history,
      summary,
      summarized_message_count: summarizedMessageCount,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail ?? "Chat request failed");
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        const event = JSON.parse(data) as ChatStreamEvent | { type: "error"; message: string };
        if (event.type === "error") {
          throw new Error(event.message);
        }

        if (event.type === "text" && typeof event.content !== "string") {
          continue;
        }

        yield event;
      }
    }
  }
}

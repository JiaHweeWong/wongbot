import type { BlogPost, BlogPostDetail, Message } from "@/types";

// Server-side (SSR/Docker): use internal container URL if set, fall back to public URL.
// Client-side (browser): always use the public URL.
const API_URL =
  typeof window === "undefined"
    ? (process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000");

export async function* streamChat(
  message: string,
  history: Message[]
): AsyncGenerator<string> {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
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
        yield JSON.parse(data) as string;
      }
    }
  }
}

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  const response = await fetch(`${API_URL}/api/blog`, {
    next: { revalidate: 60 },
  });
  if (!response.ok) throw new Error("Failed to fetch blog posts");
  return response.json() as Promise<BlogPost[]>;
}

export async function fetchBlogPost(slug: string): Promise<BlogPostDetail> {
  const response = await fetch(`${API_URL}/api/blog/${slug}`, {
    next: { revalidate: 60 },
  });
  if (!response.ok) throw new Error("Failed to fetch blog post");
  return response.json() as Promise<BlogPostDetail>;
}

import type { NextRequest } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { listPosts, getPost, loadSkillsContext } from "@/lib/content";
import { WONGBOT_SYSTEM_PROMPT } from "@/lib/prompts";
import type { Message } from "@/types";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.fixedWindow(10, "1 d"),
  prefix: "wongbot:ratelimit",
});

// Load once per cold start
const skillsContext = loadSkillsContext();
const systemPrompt = WONGBOT_SYSTEM_PROMPT.replace("{context}", skillsContext);

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return Response.json(
      { detail: "Wah, you very chatty leh! Come back tomorrow." },
      { status: 429 }
    );
  }

  const { message, history } = (await request.json()) as {
    message: string;
    history: Message[];
  };

  const messages = [
    ...history.map((m) => ({
      role: (m.role === "model" ? "assistant" : "user") as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

  const result = streamText({
    model: google(model),
    system: systemPrompt,
    messages,
    tools: {
      list_blog_posts: tool({
        description:
          "List all blog posts with their slugs, titles, dates, and previews. Call this when the user asks about blog posts or what Jia Hwee has written.",
        inputSchema: z.object({}),
        execute: async () => listPosts(),
      }),
      read_blog_post: tool({
        description:
          "Read the full content of a specific blog post by its slug. Call this after listing posts to get full details.",
        inputSchema: z.object({
          slug: z.string().describe("The slug of the blog post to read"),
        }),
        execute: async ({ slug }) => {
          const post = getPost(slug);
          if (!post) return { error: "Post not found" };
          return post;
        },
      }),
    },
    stopWhen: stepCountIs(3),
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of result.textStream) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
        );
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}

import type { NextRequest } from "next/server";
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Annotation, messagesStateReducer, START, StateGraph } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { z } from "zod";
import {
  getPost,
  getSkill,
  listPosts,
  listSkills,
  loadSkillsContext,
} from "@/lib/content";
import { WONGBOT_SYSTEM_PROMPT } from "@/lib/prompts";
import type { ChatStreamEvent, Message } from "@/types";

export const runtime = "nodejs";

const googleApiKey = process.env.GOOGLE_API_KEY;
const modelName = process.env.GEMINI_MODEL ?? "gemini-3-flash-preview";

const model = new ChatGoogleGenerativeAI({
  model: modelName,
  apiKey: googleApiKey,
  temperature: 0.4,
  streaming: true,
});

const tools = [
  tool(async () => JSON.stringify(listPosts()), {
    name: "list_blog_posts",
    description:
      "List all blog posts with their slugs, titles, dates, and previews. Call this when the user asks about blog posts or what Jia Hwee has written.",
    schema: z.object({}),
  }),
  tool(
    async ({ slug }) => {
      const post = getPost(slug);
      if (!post) return JSON.stringify({ error: "Post not found" });
      return JSON.stringify(post);
    },
    {
      name: "read_blog_post",
      description:
        "Read the full content of a specific blog post by its slug. Call this after listing posts to get full details.",
      schema: z.object({
        slug: z.string().describe("The slug of the blog post to read"),
      }),
    }
  ),
  tool(async () => JSON.stringify(listSkills()), {
    name: "list_skills",
    description:
      "List Jia Hwee's skill documents with their slugs, titles, and previews. Call this when the user asks about skills, experience, projects, achievements, or profile details.",
    schema: z.object({}),
  }),
  tool(
    async ({ slug }) => {
      const skill = getSkill(slug);
      if (!skill) return JSON.stringify({ error: "Skill document not found" });
      return JSON.stringify(skill);
    },
    {
      name: "read_skill",
      description:
        "Read the full content of a specific skill document by its slug. Call this when you need precise skill, project, achievement, or profile details.",
      schema: z.object({
        slug: z.string().describe("The slug of the skill document to read"),
      }),
    }
  ),
];

const modelWithTools = model.bindTools(tools);
const toolNode = new ToolNode(tools);

const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  summary: Annotation<string>({
    reducer: (_current, update) => update,
    default: () => "",
  }),
  lastUserMessage: Annotation<string>({
    reducer: (_current, update) => update,
    default: () => "",
  }),
});

const skillsContext = loadSkillsContext();
const baseSystemPrompt = WONGBOT_SYSTEM_PROMPT.replace("{context}", skillsContext);

async function summarizeConversation(state: typeof AgentState.State) {
  const history = state.messages.slice(0, -1);
  if (history.length === 0) {
    return { summary: "No prior conversation history." };
  }

  const summaryResponse = await model.invoke(
    [
      new SystemMessage(
        "Summarize the prior conversation for the next assistant turn. Keep only durable facts, user preferences, unresolved requests, and important context. Do not answer the user."
      ),
      ...history,
    ],
    { tags: ["summarizer"] }
  );

  return {
    summary: messageContentToText(summaryResponse.content),
  };
}

async function callPrimaryNode(state: typeof AgentState.State) {
  const systemPrompt = `${baseSystemPrompt}

Conversation summary:
${state.summary || "No prior conversation history."}

Last user message:
${state.lastUserMessage}

Tool use guidance:
Use tools only when they are needed to answer accurately. After one or two
tool calls, answer directly unless more information is essential. Do not call
the same tool repeatedly for the same question.`;

  const response = await modelWithTools.invoke(
    [new SystemMessage(systemPrompt), ...state.messages],
    { tags: ["primary"] }
  );

  return { messages: [response] };
}

const graph = new StateGraph(AgentState)
  .addNode("summarizer", summarizeConversation)
  .addNode("primary", callPrimaryNode)
  .addNode("tools", toolNode)
  .addEdge(START, "summarizer")
  .addEdge("summarizer", "primary")
  .addConditionalEdges("primary", toolsCondition)
  .addEdge("tools", "primary")
  .compile();

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.fixedWindow(10, "1 d"),
  prefix: "wongbot:ratelimit",
});

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
    ...history.map(toLangChainMessage),
    new HumanMessage(message),
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const events = graph.streamEvents(
          {
            messages,
            lastUserMessage: message,
          },
          {
            version: "v2",
            recursionLimit: 12,
          }
        );

        for await (const event of events) {
          const streamEvent = toChatStreamEvent(event);
          if (!streamEvent) continue;

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(streamEvent)}\n\n`)
          );
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Chat request failed";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}

function toLangChainMessage(message: Message): BaseMessage {
  if (message.role === "model") {
    return new AIMessage(message.content);
  }

  return new HumanMessage(message.content);
}

function toChatStreamEvent(event: {
  event: string;
  name: string;
  run_id: string;
  metadata?: Record<string, unknown>;
  data?: Record<string, unknown>;
}): ChatStreamEvent | null {
  if (
    event.event === "on_chat_model_stream" &&
    event.metadata?.langgraph_node === "primary"
  ) {
    const chunk = event.data?.chunk as { content?: unknown } | undefined;
    const content = messageContentToText(chunk?.content);
    if (!content) return null;

    return { type: "text", content };
  }

  if (event.event === "on_tool_start") {
    return {
      type: "tool_call",
      id: event.run_id,
      name: event.name,
      input: event.data?.input ?? {},
    };
  }

  if (event.event === "on_tool_end") {
    return {
      type: "tool_result",
      id: event.run_id,
      name: event.name,
      output: event.data?.output ?? null,
    };
  }

  return null;
}

function messageContentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  return content
    .map(contentPartToText)
    .join("");
}

function contentPartToText(part: unknown): string {
  if (typeof part === "string") return part;
  if (!part || typeof part !== "object") return "";

  const record = part as Record<string, unknown>;
  const text = record.text;
  if (typeof text === "string") return text;

  const content = record.content;
  if (typeof content === "string") return content;

  const type = record.type;
  if (
    type === "text" &&
    "data" in record &&
    typeof record.data === "string"
  ) {
    return record.data;
  }

  return "";
}

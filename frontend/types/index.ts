export type MessageRole = "user" | "model";

export interface Message {
  role: MessageRole;
  content: string;
  toolEvents?: ToolEvent[];
}

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  preview: string;
}

export interface BlogPostDetail extends BlogPost {
  content: string;
}

export interface SkillDocument {
  slug: string;
  title: string;
  preview: string;
}

export interface SkillDocumentDetail extends SkillDocument {
  content: string;
}

export type ChatStreamEvent =
  | { type: "text"; content: string }
  | { type: "tool_call"; id: string; name: string; input: unknown }
  | { type: "tool_result"; id: string; name: string; output: unknown };

export type ToolEvent =
  | { type: "call"; id: string; name: string; input: unknown }
  | { type: "result"; id: string; name: string; output: unknown };

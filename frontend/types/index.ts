export type MessageRole = "user" | "model";

export interface Message {
  role: MessageRole;
  content: string;
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

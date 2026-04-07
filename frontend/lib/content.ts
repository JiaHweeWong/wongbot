import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { BlogPost, BlogPostDetail } from "@/types";

const contentDir = path.join(process.cwd(), "content");

export function listPosts(): BlogPost[] {
  const postsDir = path.join(contentDir, "posts");
  const files = fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith(".mdx"))
    .sort()
    .reverse();

  return files.map((filename) => {
    const slug = filename.replace(/\.mdx$/, "");
    const raw = fs.readFileSync(path.join(postsDir, filename), "utf-8");
    const { data, content } = matter(raw);
    const words = content.trim().split(/\s+/);
    const preview = words.slice(0, 30).join(" ") + (words.length > 30 ? "..." : "");
    return {
      slug,
      title: String(data.title ?? slug),
      date: String(data.date ?? ""),
      preview,
    };
  });
}

export function getPost(slug: string): BlogPostDetail | null {
  const filePath = path.join(contentDir, "posts", `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const trimmed = content.trim();
  const words = trimmed.split(/\s+/);
  const preview = words.slice(0, 30).join(" ") + (words.length > 30 ? "..." : "");

  return {
    slug,
    title: String(data.title ?? slug),
    date: String(data.date ?? ""),
    preview,
    content: trimmed,
  };
}

export function loadSkillsContext(): string {
  const skillsDir = path.join(contentDir, "skills");
  const files = fs.readdirSync(skillsDir).filter((f) => f.endsWith(".md")).sort();
  return files
    .map((filename) => {
      const name = filename.replace(/\.md$/, "");
      const text = fs.readFileSync(path.join(skillsDir, filename), "utf-8");
      return `## ${name}\n\n${text}`;
    })
    .join("\n\n---\n\n");
}

import Link from "next/link";
import type { BlogPost } from "@/types";

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="block p-6 bg-surface border border-border rounded-xl hover:border-accent/50 hover:bg-surface-raised transition-all group"
    >
      <p className="font-mono text-xs text-muted mb-2 tracking-wide">{post.date}</p>
      <h2 className="font-display text-lg font-bold text-foreground mb-2 group-hover:text-accent transition-colors">
        {post.title}
      </h2>
      <p className="text-sm text-muted leading-relaxed line-clamp-3">{post.preview}</p>
    </Link>
  );
}

import { fetchBlogPost } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await fetchBlogPost(slug);

  return (
    <div className="max-w-2xl mx-auto w-full px-6 py-10">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors mb-8"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to blog
      </Link>
      <p className="text-xs text-muted mb-2">{post.date}</p>
      <h1 className="text-3xl font-bold text-foreground mb-8">{post.title}</h1>
      <article className="prose prose-sm prose-invert max-w-none text-foreground leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </article>
    </div>
  );
}

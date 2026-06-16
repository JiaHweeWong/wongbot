import { listPosts } from "@/lib/content";
import BlogCard from "@/components/blog/BlogCard";

export const revalidate = 60;

export const metadata = {
  title: "Blog | Wongbot",
  description: "Thoughts, projects, and random musings by Jia Hwee.",
};

export default function BlogPage() {
  const posts = listPosts();

  return (
    <div className="max-w-2xl mx-auto w-full px-6 py-10">
      <h1 className="font-display text-4xl font-bold text-foreground mb-2">Blog</h1>
      <p className="text-sm text-muted mb-10 font-mono tracking-wide">Thoughts, projects, and random musings.</p>
      {posts.length === 0 ? (
        <p className="text-muted text-sm">No posts yet. Check back soon lah!</p>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

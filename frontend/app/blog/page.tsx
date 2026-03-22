import { fetchBlogPosts } from "@/lib/api";
import BlogCard from "@/components/blog/BlogCard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blog | Wongbot",
  description: "Thoughts, projects, and random musings by Jia Hwee.",
};

export default async function BlogPage() {
  const posts = await fetchBlogPosts();

  return (
    <div className="max-w-2xl mx-auto w-full px-6 py-10">
      <h1 className="text-2xl font-bold text-foreground mb-1">Blog</h1>
      <p className="text-sm text-muted mb-8">Thoughts, projects, and random musings.</p>
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

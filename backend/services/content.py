from pathlib import Path

import frontmatter


class ContentService:
    def __init__(self, content_dir: str) -> None:
        self.content_dir = Path(content_dir)

    def load_skill_context(self) -> str:
        skills_dir = self.content_dir / "skills"
        context_parts: list[str] = []
        for path in sorted(skills_dir.glob("*.md")):
            context_parts.append(f"## {path.stem}\n\n{path.read_text()}")
        return "\n\n---\n\n".join(context_parts)

    def list_posts(self) -> list[dict]:
        posts_dir = self.content_dir / "posts"
        posts: list[dict] = []
        for path in sorted(posts_dir.glob("*.mdx"), reverse=True):
            post = frontmatter.load(str(path))
            content_text = str(post.content).strip()
            words = content_text.split()
            preview = " ".join(words[:30]) + ("..." if len(words) > 30 else "")
            posts.append(
                {
                    "slug": path.stem,
                    "title": str(post.get("title", path.stem)),
                    "date": str(post.get("date", "")),
                    "preview": preview,
                }
            )
        return posts

    def get_post(self, slug: str) -> dict | None:
        path = self.content_dir / "posts" / f"{slug}.mdx"
        if not path.exists():
            return None
        post = frontmatter.load(str(path))
        content_text = str(post.content).strip()
        words = content_text.split()
        preview = " ".join(words[:30]) + ("..." if len(words) > 30 else "")
        return {
            "slug": slug,
            "title": str(post.get("title", slug)),
            "date": str(post.get("date", "")),
            "preview": preview,
            "content": content_text,
        }

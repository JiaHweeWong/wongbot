import re
from pathlib import Path

import frontmatter

SLUG_PATTERN = re.compile(r"^[a-zA-Z0-9_-]+$")


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
        for path in posts_dir.glob("*.mdx"):
            post = frontmatter.load(str(path))
            content_text = str(post.content).strip()
            posts.append(
                {
                    "slug": path.stem,
                    "title": str(post.get("title", path.stem)),
                    "date": str(post.get("date", "")),
                    "preview": self._preview(content_text),
                }
            )
        return sorted(posts, key=lambda post: post["date"], reverse=True)

    def get_post(self, slug: str) -> dict | None:
        if not SLUG_PATTERN.fullmatch(slug):
            return None

        path = self.content_dir / "posts" / f"{slug}.mdx"
        if not path.exists():
            return None
        post = frontmatter.load(str(path))
        content_text = str(post.content).strip()
        return {
            "slug": slug,
            "title": str(post.get("title", slug)),
            "date": str(post.get("date", "")),
            "preview": self._preview(content_text),
            "content": content_text,
        }

    def list_skills(self) -> list[dict]:
        skills_dir = self.content_dir / "skills"
        skills: list[dict] = []
        for path in sorted(skills_dir.glob("*.md")):
            content = path.read_text().strip()
            skills.append(
                {
                    "slug": path.stem,
                    "title": path.stem,
                    "preview": self._preview(content),
                }
            )
        return skills

    def get_skill(self, slug: str) -> dict | None:
        if not SLUG_PATTERN.fullmatch(slug):
            return None

        path = self.content_dir / "skills" / f"{slug}.md"
        if not path.exists():
            return None

        content = path.read_text().strip()
        return {
            "slug": slug,
            "title": slug,
            "preview": self._preview(content),
            "content": content,
        }

    @staticmethod
    def _preview(content: str) -> str:
        words = content.split()
        return " ".join(words[:30]) + ("..." if len(words) > 30 else "")

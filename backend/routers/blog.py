from fastapi import APIRouter, HTTPException

from models import BlogPost, BlogPostDetail
from services.content import ContentService


def create_blog_router(content_service: ContentService) -> APIRouter:
    router = APIRouter(prefix="/api")

    @router.get("/blog", response_model=list[BlogPost])
    def list_posts() -> list[BlogPost]:
        posts = content_service.list_posts()
        return [BlogPost(**post) for post in posts]

    @router.get("/blog/{slug}", response_model=BlogPostDetail)
    def get_post(slug: str) -> BlogPostDetail:
        post = content_service.get_post(slug)
        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")
        return BlogPostDetail(**post)

    return router

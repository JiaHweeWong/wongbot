from pydantic import BaseModel


class Message(BaseModel):
    role: str  # "user" or "model" (Gemini convention)
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[Message] = []


class BlogPost(BaseModel):
    slug: str
    title: str
    date: str
    preview: str


class BlogPostDetail(BlogPost):
    content: str

from pydantic import BaseModel, Field


class Message(BaseModel):
    role: str  # "user" or "model" (Gemini convention)
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[Message] = Field(default_factory=list)
    summary: str = ""
    summarized_message_count: int = Field(default=0, ge=0)


class BlogPost(BaseModel):
    slug: str
    title: str
    date: str
    preview: str


class BlogPostDetail(BlogPost):
    content: str

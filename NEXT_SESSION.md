# Next session: blog tool-calling for Wongbot

## Goal

Give Wongbot the ability to read blog posts on demand, rather than having all content concatenated into the system prompt at startup. The LLM will decide when to fetch a post based on the conversation.

## Approach: native tool/function calling

No LangChain, no RAG, no vector DB. Both Gemini and OpenAI SDKs support tool/function calling natively. We define tools, the LLM calls them, we execute them and feed results back, the LLM continues.

**Tools to expose:**

- `list_blog_posts()` — returns list of post slugs, titles, dates, previews
- `read_blog_post(slug: str)` — returns full markdown content of a post

**Example flow:**

> User: "What have you written about software engineering?"
> → LLM calls `list_blog_posts()`
> → sees relevant post "My First Year as an Engineer"
> → calls `read_blog_post("first-year-engineer")`
> → answers based on full content

## What needs to change

### `services/prompts.py`
- Define tool schemas (JSON schema format for both Gemini and OpenAI)
- Update system prompt to mention that blog post tools are available

### `services/llm_base.py`
- Update `LLMService` protocol if needed to pass `ContentService` or a tool executor

### `services/gemini.py` — `GeminiService`
- Accept `ContentService` (or a tool callable dict) at init
- In `stream_response`: implement the tool-call loop
  - Stream until a tool call is requested
  - Execute the tool locally
  - Inject tool result back into the conversation
  - Continue streaming

### `services/openai_service.py` — `OpenAIService`
- Same pattern as Gemini, but using OpenAI's tool call API

### `main.py`
- Pass `content_service` into the LLM service constructor

## Complexity notes

- Streaming + tool calls is the tricky part: need to pause the stream, execute the tool, re-submit with the result, then resume streaming
- Both SDKs handle this differently:
  - Gemini: `generate_content_stream` with `tools` param, check for `function_call` parts in the response
  - OpenAI: `stream=True` with `tools` param, check for `finish_reason == "tool_calls"`
- The tool executor logic (slug → ContentService call) can be shared in a simple dict or helper function
- Keep the skill context in the system prompt as-is — only blog posts move to on-demand tool calls

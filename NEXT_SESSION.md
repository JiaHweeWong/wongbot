# Next session plan

---

## 1. Deploy to production ← do this first

### Architecture

Everything on Railway — one platform, one dashboard, one bill.

```
Browser → jiahwee.com (Railway, frontend service)
                ↓
    Railway internal network (Railway, backend service)
```

### Step-by-step

**1. Create Railway project**
- Create account at railway.app, connect GitHub repo
- New project → Deploy from GitHub repo

**2. Add backend service**
- Add service → GitHub repo
- Settings → Build:
  - **Dockerfile path**: `backend/Dockerfile`
  - **Build context**: `/` (repo root — needed so Dockerfile can copy `content/`)
- Add env vars:
  ```
  LLM_MODEL=gemini/gemini-2.5-flash
  GEMINI_API_KEY=...
  CONTENT_DIR=/content
  RATE_LIMIT_PER_DAY=10
  ALLOWED_ORIGINS=["https://jiahwee.com", "https://www.jiahwee.com"]
  ```
- Railway gives you a URL like `wongbot-backend.up.railway.app` — save this

**3. Add frontend service**
- Add another service → same GitHub repo
- Settings → Build:
  - **Dockerfile path**: `frontend/Dockerfile`
  - **Build context**: `frontend/`
- Add env vars:
  ```
  NEXT_PUBLIC_API_URL=https://wongbot-backend.up.railway.app
  API_INTERNAL_URL=http://backend:8000   # if services are on same Railway private network
  ```

**4. Buy domain on porkbun.com** (e.g. `jiahwee.com`)

**5. Add custom domain to frontend service in Railway**
- Frontend service → Settings → Networking → Custom Domain → `jiahwee.com`
- Railway shows exact DNS records to set

**6. Add DNS records in Porkbun**
- DNS Management → add the records Railway provided
- Propagates in minutes to ~1 hour

### Notes
- Railway auto-deploys both services on every push to `main`
- `content/` is baked into the backend Docker image — update blog posts/skills by pushing to `main`

---

## 2. Blog tool-calling for Wongbot

### Goal

Give Wongbot the ability to read blog posts on demand rather than concatenating everything into the system prompt. The LLM decides when to fetch content based on the conversation.

### Approach: native LiteLLM tool calling

LiteLLM normalises tool/function calling across all providers — this is the big win from switching to LiteLLM. Define tools once, works with Gemini, OpenAI, Anthropic, etc.

**Tools to expose:**
- `list_blog_posts()` — returns list of slugs, titles, dates, previews
- `read_blog_post(slug: str)` — returns full markdown content of a post

**Example flow:**
> User: "What have you written about software engineering?"
> → LLM calls `list_blog_posts()`
> → sees relevant post, calls `read_blog_post("first-year-engineer")`
> → answers based on full content

### What needs to change

- **`services/prompts.py`** — add tool schemas (LiteLLM uses OpenAI-compatible format)
- **`services/litellm_service.py`** — accept `ContentService` at init, implement tool-call loop in `stream_response`
- **`main.py`** — pass `content_service` into `LiteLLMService`
- Keep skill context in system prompt as-is — only blog posts move to on-demand tool calls

### Complexity notes
- Streaming + tool calls requires pausing the stream, executing the tool, re-submitting with the result, then resuming
- LiteLLM normalises this: check `finish_reason == "tool_calls"`, execute, re-call with tool result appended to messages
- Much simpler than doing it with raw Gemini/OpenAI SDKs

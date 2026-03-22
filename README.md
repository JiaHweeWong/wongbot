# wongbot

Personal website for Jia Hwee Wong. Wongbot (a pun on "wongbok cabbage 🥬") is the AI chatbot homepage — ask it anything about me.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, Tailwind CSS v4, react-markdown |
| Backend | FastAPI (Python 3.12), uv |
| LLM | Gemini 2.5 Flash or OpenAI (configurable via env) |
| Hosting | Vercel (frontend) + Railway (backend) |

## Project structure

```
wongbot/
├── frontend/         # Next.js app (chat UI + blog)
├── backend/          # FastAPI app (chat API + blog API)
├── content/
│   ├── posts/        # MDX blog posts (public)
│   └── skills/       # Markdown context files for Wongbot (private)
└── Makefile
```

## Quick start

**First-time setup:**

```bash
cd backend && cp .env.example .env   # add your GEMINI_API_KEY (or OPENAI_API_KEY)
uv sync
cd ../frontend && cp .env.local.example .env.local
npm install
```

**Required `backend/.env` vars:**

```
LLM_PROVIDER=gemini         # or "openai"
LLM_MODEL=gemini-2.5-flash  # or e.g. "gpt-4o"
GEMINI_API_KEY=...          # required if LLM_PROVIDER=gemini
OPENAI_API_KEY=...          # required if LLM_PROVIDER=openai
```

**Run everything (single terminal):**

```bash
make dev
# backend → http://localhost:8000
# frontend → http://localhost:3000
```

Ctrl+C stops both.

### Wongbot context

Fill in `content/skills/about.md`, `projects.md`, and `achievements.md` with your actual info — this is how Wongbot knows about you.

## Makefile

```bash
make lint              # ruff check
make fix               # ruff check --fix
make format            # ruff format
make check             # lint + format dry-run
make sync-env-example  # regenerate .env.example from .env (keys only, no values)
```

## Deployment

- **Frontend**: connect repo to Vercel, set root directory to `frontend/`, add `NEXT_PUBLIC_API_URL`
- **Backend**: connect repo to Railway, set root directory to `backend/`, add env vars, start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

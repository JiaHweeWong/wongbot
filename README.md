# wongbot

Personal website for Jia Hwee Wong. Wongbot (a pun on "wongbok cabbage 🥬") is the AI chatbot homepage — ask it anything about me.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, Tailwind CSS v4, react-markdown |
| Backend | FastAPI (Python 3.12), uv |
| LLM | Any LiteLLM-supported model (Gemini, OpenAI, etc.) |
| Hosting | Railway (frontend + backend) |

## Project structure

```
wongbot/
├── frontend/         # Next.js app (chat UI + blog)
├── backend/          # FastAPI app (chat API + blog API)
├── content/
│   ├── posts/        # MDX blog posts (public)
│   └── skills/       # Markdown context files for Wongbot (private)
├── docker-compose.yml
└── Makefile
```

## Quick start

### Local dev (no Docker)

**First-time setup:**

```bash
cd backend && cp .env.example .env   # add your API key
uv sync
cd ../frontend && cp .env.local.example .env.local
npm install
```

**`backend/.env` — required vars:**

```
# LiteLLM model string: provider/model-name
LLM_MODEL=gemini/gemini-2.5-flash

# API key for your chosen provider
GEMINI_API_KEY=...    # for gemini/* models
OPENAI_API_KEY=...    # for openai/* models
```

**Run (single terminal):**

```bash
make dev
# backend → http://localhost:8000
# frontend → http://localhost:3000
```

### Docker

```bash
make docker   # builds and starts both services via docker compose
```

Requires `backend/.env` to exist with your API key. Content edits (`content/`) are reflected live without a rebuild.

### Wongbot context

Fill in `content/skills/about.md`, `projects.md`, and `achievements.md` — this is how Wongbot knows about you.

## Makefile

```bash
make dev               # run backend + frontend locally (single terminal)
make docker            # docker compose up --build
make lint              # ruff check
make fix               # ruff check --fix
make format            # ruff format
make check             # lint + format dry-run
make sync-env-example  # regenerate .env.example from .env (keys only, no values)
```

## Deployment

Both services hosted on Railway (one platform, one bill).

- **Backend service**: Dockerfile `backend/Dockerfile`, build context `/` (repo root)
- **Frontend service**: Dockerfile `frontend/Dockerfile`, build context `frontend/`
- Custom domain added to the frontend service in Railway, DNS pointed from Porkbun

See `NEXT_SESSION.md` for the full step-by-step deployment guide.

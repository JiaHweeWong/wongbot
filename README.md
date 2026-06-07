# wongbot

Personal website for Jia Hwee Wong. Wongbot (a pun on "wongbok cabbage 🥬") is the AI chatbot homepage — ask it anything about me.

## Stack

| Layer | Tech |
|---|---|
| Frontend + API | Next.js 16, Tailwind CSS v4, react-markdown |
| LLM orchestration | LangGraph + LangChain Google (Gemini) |
| Rate limiting | Upstash Redis |
| Hosting | Vercel (free tier) |

## Project structure

```
wongbot/
├── frontend/
│   ├── app/
│   │   └── api/chat/     # LangGraph chat route (LLM + tools + rate limiting)
│   ├── content/
│   │   ├── posts/        # MDX blog posts (public)
│   │   └── skills/       # Markdown context files for Wongbot (private)
│   └── lib/
│       ├── content.ts    # Reads blog posts and skills from filesystem
│       └── prompts.ts    # Wongbot system prompt
├── backend/              # FastAPI app (local dev / reference only, not deployed)
├── docker-compose.yml
└── Makefile
```

## Agent architecture

![Wongbot agent architecture](docs/agent-architecture.svg)

## Quick start

**First-time setup:**

```bash
cd frontend
cp .env.example .env.local   # fill in your keys
npm install
npm run dev                   # → http://localhost:3000
```

**`frontend/.env.local` — required vars:**

```
GOOGLE_API_KEY=...              # Gemini API key (aistudio.google.com)
UPSTASH_REDIS_REST_URL=...      # Upstash Redis (upstash.com, free tier)
UPSTASH_REDIS_REST_TOKEN=...
```

Optional:
```
GEMINI_MODEL=gemini-3-flash-preview   # defaults to gemini-3-flash-preview if unset
```

### Docker (full stack with backend)

```bash
make docker   # builds and starts both services via docker compose
```

Requires `backend/.env` to exist with your API key. See `backend/.env.example`.

### Wongbot context

Fill in `frontend/content/skills/about.md`, `projects.md`, and `achievements.md` — this is how Wongbot knows about you. The chat route can also read these skill files and public blog posts through its LangGraph tools during a conversation.

### Conversation management

Wongbot keeps the latest 10 messages verbatim. Messages that move outside that
window are incorporated into a rolling summary in batches of five. Incomplete
batches remain in the primary model context until the next summary update, so
no conversation context is dropped.

Primary responses are capped at 700 output tokens and summaries at 300. Upstash
limits usage to 10 requests per IP and 100 requests globally each day.

## Makefile

```bash
make docker   # docker compose up --build
make lint     # ruff check (backend)
make fix      # ruff check --fix (backend)
make format   # ruff format (backend)
make check    # lint + format dry-run
```

## Deployment

Hosted on Vercel. Connect the GitHub repo in the Vercel dashboard with:

- **Root Directory**: `frontend`
- **Framework Preset**: `Next.js`

Env vars to set in Vercel: `GOOGLE_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

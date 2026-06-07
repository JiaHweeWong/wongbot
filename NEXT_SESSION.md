# Next session plan

## Verify the Vercel deployment

The frontend, API route, LangGraph agent, summarizer, tools, and rate limits all
run in the same Vercel project.

### Vercel configuration

- Root Directory: `frontend`
- Framework Preset: `Next.js`
- Production domains: `jiahwee.com` and the generated Vercel domain

Required environment variables:

```text
GOOGLE_API_KEY=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Optional environment variable:

```text
GEMINI_MODEL=gemini-3-flash-preview
```

### Verification

1. Deploy the rollback branch through a pull request to `main`.
2. Confirm `/api/chat` responds without contacting `localhost:8000`.
3. Confirm response text and tool calls stream in the chat UI.
4. Confirm the latest 10 messages remain verbatim.
5. Confirm aged-out messages are summarized in batches of five.
6. Confirm the 10-per-IP and 100-global daily Upstash limits are active.

Content under `frontend/content/` is included in each Vercel deployment. Publish
blog or skill updates by merging them into `main`.

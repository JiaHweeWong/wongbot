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
  LLM_MODEL=gemini/gemini-3-flash-preview
  GEMINI_API_KEY=...
  CONTENT_DIR=/content
  RATE_LIMIT_PER_DAY=10
  GLOBAL_RATE_LIMIT_PER_DAY=100
  MAX_RESPONSE_TOKENS=700
  MAX_SUMMARY_TOKENS=300
  ALLOWED_ORIGINS=["https://jiahwee.com", "https://www.jiahwee.com"]
  ```
- Railway gives you a URL like `wongbot-backend.up.railway.app` — save this

**3. Add frontend service**
- Add another service → same GitHub repo
- Settings → Build:
  - **Dockerfile path**: `frontend/Dockerfile`
  - **Build context**: `/` (repo root)
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
- `frontend/content/` is baked into the backend Docker image — update blog
  posts/skills by pushing to `main`
- The Python agent in `backend/services/agent.py` owns summarization, tool
  execution, and streamed responses.

# Build context must be the repo root (set in docker-compose.yml)
FROM python:3.12-slim

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Install dependencies (cached layer — only re-runs when pyproject.toml/uv.lock changes)
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev

# Copy source
COPY backend/ .

# Copy content directory (skills + posts)
COPY content/ /content

ENV CONTENT_DIR=/content

EXPOSE 8000
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

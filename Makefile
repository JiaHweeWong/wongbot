.PHONY: dev docker lint fix format check

dev:
	cd frontend && npm run dev

docker:
	docker compose up --build

lint:
	cd backend && uv run ruff check .

fix:
	cd backend && uv run ruff check --fix .

format:
	cd backend && uv run ruff format .

check: lint
	cd backend && uv run ruff format --check .


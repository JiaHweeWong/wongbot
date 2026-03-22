.PHONY: dev lint fix format check sync-env-example

dev:
	@trap 'kill 0' INT; \
	(cd backend && uv run uvicorn main:app --reload) & \
	(cd frontend && npm run dev) & \
	wait

lint:
	cd backend && uv run ruff check .

fix:
	cd backend && uv run ruff check --fix .

format:
	cd backend && uv run ruff format .

check: lint
	cd backend && uv run ruff format --check .

sync-env-example:
	@test -f backend/.env || (echo "Error: backend/.env not found" && exit 1)
	@grep -E '^[^#[:space:]]' backend/.env | sed 's/=.*/=/' > backend/.env.example
	@echo "Updated backend/.env.example"

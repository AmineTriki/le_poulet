.PHONY: dev dev-api dev-web dev-mobile test lint migrate migrate-new seed build deploy-web deploy-api deploy-mobile add-city challenges analyze reset

dev:
	docker compose up -d postgres redis && pnpm turbo dev

dev-api:
	cd apps/api && uv run uvicorn app.main:app --reload --port 8000

dev-web:
	cd apps/web && pnpm dev

dev-mobile:
	cd apps/mobile && pnpm expo start

test:
	cd apps/api && uv run pytest && pnpm turbo test

lint:
	cd apps/api && uv run ruff check . && uv run mypy . && pnpm turbo lint typecheck

migrate:
	cd apps/api && uv run alembic upgrade head

migrate-new:
	cd apps/api && uv run alembic revision --autogenerate -m "$(MSG)"

seed:
	cd apps/api && uv run python -m scripts.seed

test-game:
	cd apps/api && uv run python -m scripts.seed_test_game

simulate:
	cd apps/api && uv run python -m scripts.simulate_game --players 8 --duration 60

simulate-fast:
	cd apps/api && uv run python -m scripts.simulate_game --players 4 --duration 30 --fast

build:
	pnpm turbo build

deploy-web:
	vercel --prod --cwd apps/web

deploy-api:
	railway up --service api

deploy-mobile:
	cd apps/mobile && eas build --platform ios && eas submit --platform ios

add-city:
	cd apps/api && uv run python -m scripts.add_city

challenges:
	cd apps/api && uv run python -m scripts.generate_challenges

analyze:
	cd apps/web && ANALYZE=true pnpm build

reset:
	docker compose down -v && docker compose up -d postgres redis && sleep 3 && make migrate && make seed

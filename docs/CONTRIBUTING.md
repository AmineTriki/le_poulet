# Contributing to Le Poulet

Le Poulet is open source and chaotic in the best possible way. Contributions are welcome.

---

## Development Setup

### 1. Clone and install

```bash
git clone https://github.com/aminetriki/le-poulet.git
cd le-poulet
pnpm install
```

Requires Node 20+, pnpm 9+, Python 3.12+, and `uv` (install at https://docs.astral.sh/uv/).

### 2. Start infrastructure

```bash
docker compose up -d
# Starts Postgres 16 on :5432 and Redis 7 on :6379
```

### 3. Set up the API

```bash
cd apps/api
cp .env.example .env          # edit DATABASE_URL and SECRET_KEY
uv sync                       # install Python deps
uv run alembic upgrade head   # run migrations
uv run python -m scripts.seed # seed challenges + cities
uv run uvicorn app.main:app --reload --port 8000
```

### 4. Start the web app

```bash
cd apps/web
cp .env.example .env.local    # set NEXT_PUBLIC_API_URL=http://localhost:8000
pnpm dev                      # starts on :3000
```

### 5. Start the mobile app (optional)

```bash
cd apps/mobile
cp .env.example .env
pnpm expo start               # opens Expo Go QR code
# or: pnpm ios (requires Xcode 15+)
```

Or just run everything at once from the root:

```bash
make dev
```

---

## Code Style

### Python (apps/api)

- **ruff** handles linting and formatting. Configuration is in `pyproject.toml`.
- **mypy** enforces types. All public functions must have full type annotations.
- Use `async def` for all route handlers and service functions.
- Keep route handlers thin — business logic lives in `app/services/`.
- SQLModel models are the single source of truth for DB schema + validation.

```bash
cd apps/api
uv run ruff check . --fix      # lint + auto-fix
uv run ruff format .           # format
uv run mypy app/               # type check
```

### TypeScript (apps/web, apps/mobile, packages)

- **ESLint** with `@le-poulet/config/eslint` shared config.
- **Prettier** for formatting (`pnpm format` from root).
- No `any` — use `unknown` and narrow, or write proper types.
- Prefer `const` and functional components.
- All exported hooks and components must have TypeScript interfaces for props.

```bash
pnpm turbo lint typecheck
pnpm format
```

### General rules

- No commented-out code in PRs.
- No `console.log` in production code (use proper logging or remove).
- Keep components focused — if a file exceeds ~200 lines, consider splitting.
- CSS: Tailwind utility classes on web, `StyleSheet.create` on mobile. No inline styles for anything that repeats.

---

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) enforced by Commitizen.

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type | When to use |
|------|-------------|
| `feat` | New feature or user-visible capability |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code restructure without feature/fix |
| `test` | Add or fix tests |
| `chore` | Build scripts, config, dependencies |
| `perf` | Performance improvement |

### Scopes

`api`, `web`, `mobile`, `shared`, `ui`, `config`, `ci`, `docs`

### Examples

```
feat(api): add weapon cooldown enforcement per team

fix(mobile): prevent double-tap on capture button in CameraChallenge

docs(api): add weapon config endpoint to API.md

test(api): add coverage for circle shrink edge cases

chore(ci): bump uv version in CI to 0.4.4

feat(web): add bilingual toggle to lobby page

refactor(shared): extract scoring constants to utils/scoring.ts
```

### Breaking changes

Add `BREAKING CHANGE:` in the footer:

```
feat(api)!: rename game status "waiting" to "lobby"

BREAKING CHANGE: clients must update status comparisons from "waiting" to "lobby"
```

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production — auto-deploys to Vercel, Railway, triggers release-please |
| `dev` | Integration branch — CI runs on push |
| `feat/<name>` | Feature work — PR target is `dev` |
| `fix/<name>` | Bug fixes — PR target is `dev` or `main` for hotfixes |
| `chore/<name>` | Maintenance — PR target is `dev` |

Direct pushes to `main` are blocked by the `no-commit-to-branch` pre-commit hook.

---

## Pull Request Process

1. **Branch** off `dev` (or `main` for hotfixes).
2. Write the code with tests.
3. Run the full check locally:
   ```bash
   make lint test
   ```
4. Open a PR against `dev`. Fill in:
   - What does this change?
   - Why is this the right approach?
   - How was it tested?
5. CI must pass (Python lint + tests, web typecheck/lint, package typecheck).
6. One approval required from a maintainer.
7. Squash-merge or merge commit — no rebase merge to keep history readable.

### PR Title

Use the same Conventional Commits format as commit messages:
```
feat(api): implement circle shrink scheduling
fix(mobile): handle background location denial gracefully
```

---

## Testing Requirements

### API (Python)

All new routes and service functions must have tests in `apps/api/tests/`.

```bash
cd apps/api
uv run pytest                          # run all tests
uv run pytest tests/test_games.py -v  # specific file
uv run pytest --cov=app               # with coverage
```

- Use `pytest-asyncio` for async tests.
- Use the `AsyncSession` from `conftest.py` — don't hit the real DB.
- Mock external HTTP calls (Overpass API) with `httpx`'s `MockTransport`.
- Aim for >80% coverage on new service code.

### TypeScript (web, mobile, packages)

- Pure utility functions in `packages/shared` should have Jest unit tests.
- React components: test user interactions, not implementation details.
- Complex hooks should have tests verifying state transitions.

```bash
pnpm turbo test
```

### What does NOT need tests

- One-line config helpers
- Type definitions (`.ts` files with only `interface` / `type`)
- Generated files
- Thin router handlers that just delegate to a tested service function

---

## Adding a New City

See `docs/ADDING_A_CITY.md` for the full step-by-step guide. In short:

1. Add the city to `apps/api/data/cities.json`
2. Add city-specific challenges to `challenges_en.json` and `challenges_fr.json`
3. Update city selectors in the web and mobile create-game screens
4. Test the Overpass bbox query
5. Open a PR with the `feat(api): add <city> city` title

---

## Questions?

Open a GitHub Discussion or drop into the issue tracker. Keep it constructive.

# project-library

Personal Project Library — full spec in `context/project-idea.md` (product vision) and `context/architecture.md` (technical plan, data model, API surface, phased roadmap). Read those before making architectural changes.

## Stack
SvelteKit (Node adapter) + better-sqlite3 (WAL mode) + Tailwind v4 + `@catppuccin/tailwindcss` (Mocha) + zod + marked/DOMPurify + sharp.

## Conventions
- All DB access goes through `src/lib/server/`. Hand-written SQL in `repos/`, no ORM.
- Schema changes are additive migration files in `src/lib/server/migrations/` (`00N_name.sql`, imported via `?raw` and registered in `migrations/index.ts`). Never edit a shipped migration — add a new one.
- All API input validated with zod at the route boundary.
- Single data directory (`$DATA_DIR`, see `.env`) holds the DB and asset files — this is the entire backup surface.
- Build in the phase order set out in `context/architecture.md` §10; each phase should leave the app usable end-to-end before moving to the next.
- Production deploys clone this repo with git (read-only deploy key if the remote is private) into a `src/` subdirectory next to `data/` and `docker-compose.yml` — never a one-off file copy. Updates are `git pull` + rebuild, so `git log -1` on the deploy host always says exactly what's running. See README.md's Deployment section.
- `docker-compose.example.yml` uses `env_file: .env`, not per-variable `${VAR}` substitution — add new env vars to `.env` only, never split config across both files.
- Never hardcode `secure: true` on a session/auth cookie — derive it from the actual request (`url.protocol === 'https:'`). SvelteKit's own default is `secure: true` unconditionally in production, which silently drops the cookie over plain HTTP.

## Commands
- `npm run dev` — dev server
- `npm run build` / `npm run preview` — production build/preview
- `npm run check` — svelte-check + type sync

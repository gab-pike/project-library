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

## Commands
- `npm run dev` — dev server
- `npm run build` / `npm run preview` — production build/preview
- `npm run check` — svelte-check + type sync

# Project Library

A personal library for multipassionate people — a self-hosted app for tracking hobby and
side projects across the pause/resume cycles real life actually runs on. It's built around a
simple idea: **putting a project down shouldn't mean losing your place in it.**

Capture an idea → start a project → document what happens → pause it → find it again months
later and immediately know where you left off → finish it and keep the summary as a reference
forever.

See [`context/project-idea.md`](context/project-idea.md) for the full product vision and
[`context/architecture.md`](context/architecture.md) for the technical design, data model, and
phased build roadmap this app was built against (all five phases are complete — this is v1.0).

## Features

- **Library** — categorized, filterable, searchable grid of every project, with cover images
  and a colored left-border/badge showing status at a glance
- **Project workspace** — overview & goals, tasks (grouped, reorderable), important dates,
  a chronological progress-update journal, multiple named Markdown notes with live preview,
  grouped links, and file/photo uploads with auto-generated thumbnails
- **Pause / resume** — record a 4-field "bookmark" (last done, working on, problems, next
  steps) when you set a project down; it's waiting for you as a banner the moment you open it
  again
- **Complete** — a templated Markdown summary (what it was, what was accomplished, decisions,
  challenges, resources, lessons, result); completed projects stay fully browsable
- **Duplicate** — reuse a project's notes/tasks/links as the starting point for a new one
- **Idea inbox** — capture a thought with zero structure, promote it to a full project later
- **Full-text search** — one box searches project titles/overviews, notes, updates, and ideas
  at once, with highlighted result snippets
- **Export & backups** — the whole library mirrors out to human-readable Markdown on demand or
  nightly, alongside nightly SQLite snapshots (14 kept) — your data stays yours even if this
  app doesn't exist someday
- **Installable PWA** — add it to your phone's home screen, with a shortcut straight to idea
  capture

## Stack

SvelteKit (Node adapter) · better-sqlite3 (WAL mode) · SQLite FTS5 · Tailwind v4 +
[Catppuccin Mocha](https://github.com/catppuccin/tailwindcss) · zod · marked + DOMPurify ·
sharp

Single Docker container, one bind-mounted data directory, no external services — see
[`context/architecture.md`](context/architecture.md) §1–3 for why.

## Getting started (development)

Requires Node 20+ and npm.

```sh
npm install
cp .env.example .env
```

Fill in `.env` — `DATA_DIR` can stay as `./data` for local dev. Generate the two secrets:

```sh
# AUTH_PASSWORD_HASH — replace 'your-password' with your chosen login password
node -e "const c=require('crypto'),s=c.randomBytes(16);console.log(s.toString('hex')+':'+c.scryptSync(process.argv[1],s,64).toString('hex'))" 'your-password'

# SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then:

```sh
npm run dev       # dev server at http://localhost:5173
npm run check     # svelte-check + type sync
npm run build     # production build (also what the Dockerfile runs)
npm run preview   # serve the production build locally
```

The SQLite schema is created and migrated automatically on first boot — no manual migration
step. Six default categories are seeded the first time too.

## Deployment

```sh
docker build -t project-library .
cp docker-compose.example.yml docker-compose.yml   # edit the bind-mount path, TZ, ports
docker compose up -d
```

Required environment variables (see `docker-compose.example.yml`):

| Variable             | Purpose                                                                 |
| --------------------- | ------------------------------------------------------------------------ |
| `DATA_DIR`            | Where the SQLite DB, uploaded assets, exports, and backups live         |
| `AUTH_PASSWORD_HASH`  | `salt:hash` from the scrypt command above — the single login password  |
| `SESSION_SECRET`      | Random hex used to sign session cookies                                |
| `MAX_UPLOAD_MB`       | Per-file upload size cap (default 200)                                 |
| `BODY_SIZE_LIMIT`     | adapter-node's own request-body cap, in bytes — must be ≥ `MAX_UPLOAD_MB` or large uploads get rejected before the app ever sees them |

Put it behind a reverse proxy (Caddy example in `context/architecture.md` §8) for TLS and a
real hostname; the app itself only speaks plain HTTP.

## Data & backups

Everything lives under `$DATA_DIR`:

```
data/
├── library.db          # SQLite database (WAL mode)
├── assets/<project-id>/  # uploaded files + generated thumbnails
├── exports/<timestamp>/  # human-readable Markdown mirror of the whole library
└── backups/               # nightly VACUUM INTO snapshots (last 14 kept)
```

An export and a backup both run automatically every night at 2am server time. Trigger an
export manually from the **Export** page in the app, or `POST /api/export`.

**Restore:** stop the app, replace `data/library.db` with a backup file, start the app again.

**Backing up the whole app** is just copying the `data/` directory — that's the entire state.

## Project structure

```
src/
├── lib/
│   ├── server/
│   │   ├── db.ts            # better-sqlite3 connection + pragmas
│   │   ├── migrations/      # numbered .sql files, applied automatically at boot
│   │   ├── repos/           # hand-written SQL per entity, no ORM
│   │   ├── auth.ts          # session cookie signing/verification
│   │   ├── assets.ts        # upload handling, mime allowlist, thumbnails
│   │   ├── export.ts        # Markdown export
│   │   └── scheduler.ts     # nightly backup + export
│   ├── components/
│   └── types.ts             # zod schemas, shared across API routes and form actions
└── routes/
    ├── +page.svelte         # library home
    ├── projects/[id]/       # the tabbed project workspace
    ├── ideas/, categories/, search/, export/, login/
    └── api/                 # REST surface — see context/architecture.md §5
```

`CLAUDE.md` has conventions for anyone (human or AI) picking this codebase back up.

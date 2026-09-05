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

Recommended layout — git is the source of truth on the deploy host too, not a one-time file
copy, so `git pull` is always how updates land:

```
<deploy-dir>/
├── src/                 # this repo, git-cloned (read-only deploy key if the remote is private)
├── data/                # the entire app state — created on first run, never deleted/rebuilt
├── .env
└── docker-compose.yml   # cp docker-compose.example.yml here and edit the bind-mount path
```

```sh
mkdir -p <deploy-dir>/data && cd <deploy-dir>
git clone <this-repo-url> src
cp src/docker-compose.example.yml docker-compose.yml   # edit the bind-mount path, TZ, ports
cp src/.env.example .env                               # fill in the values below
cd src && docker build -t project-library . && cd ..
docker compose up -d
```

After the first run, `src/scripts/update.sh` does `git pull` + rebuild + `compose up -d
--force-recreate` in one step — run it from anywhere, it resolves `src/`/`data/`/the compose
file relative to its own location, not the deploy path above specifically.

Environment variables — **all of them belong in `.env`**, since `docker-compose.example.yml`
uses `env_file: .env` (adding a variable to `.env` alone is enough; you don't also need to
wire it into the compose file's `environment:` list — that only substitutes vars explicitly
listed there, `env_file` injects everything):

| Variable              | Purpose                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `DATA_DIR`            | `/data` in Docker (matches the bind mount) — **not** the host path, and not `./data` (that's the local-dev-only value)               |
| `AUTH_PASSWORD_HASH`  | `salt:hash` from the scrypt command above — the single login password. Never the plaintext password itself.                          |
| `SESSION_SECRET`      | Random hex used to sign session cookies                                                                                              |
| `MAX_UPLOAD_MB`       | Per-file upload size cap (default 200)                                                                                               |
| `BODY_SIZE_LIMIT`     | adapter-node's own request-body cap, in bytes — must be ≥ `MAX_UPLOAD_MB` or large uploads get rejected before the app ever sees them |
| `ORIGIN`              | **Required behind a reverse proxy.** The exact public URL (`https://projects.example.com`) — without it, every form submission (login included) gets a silent 403; see Troubleshooting below |

Put it behind a reverse proxy (Caddy example in `context/architecture.md` §8) for TLS and a
real hostname; the app itself only speaks plain HTTP.

### Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Login always fails, no error | `AUTH_PASSWORD_HASH`/`SESSION_SECRET` blank or malformed | The app now logs a clear warning to the container logs at boot if either looks wrong — check `docker compose logs` |
| Login form 403s, or just silently does nothing | Running behind a reverse proxy without `ORIGIN` set — SvelteKit's CSRF check rejects a POST whose `Origin` header doesn't match what it can determine as its own address | Set `ORIGIN` in `.env` to the exact hostname+scheme in the browser's address bar, then `docker compose up -d --force-recreate` |
| Login POST redirects but bounces right back to the login page | Session cookie was marked `Secure` while served over plain HTTP — browsers silently refuse to store it | Fixed in code (`secure` is now derived from the actual request protocol) — update if you're on an older build |
| A new `.env` variable doesn't seem to take effect | It was added to `.env` but the compose file lists env vars individually (`KEY=${KEY}`) rather than using `env_file` | Use the `env_file: .env` pattern from `docker-compose.example.yml` — it injects everything in the file automatically |
| 500 on every page; `SqliteError: unable to open database file` | `data/` is owned by a different user than the container runs as (the image runs as uid 1000) | `chown -R 1000:1000` on the host's `data/` directory |
| `docker build` fails on native modules (`better-sqlite3`, `sharp`) | Stale `node_modules` from the host leaking into the build context | Make sure `.dockerignore` is present (it ships with the repo) — it excludes `node_modules`, `.svelte-kit`, `build`, and `data` from what gets sent to `docker build` |

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
│   │   ├── db.ts            # better-sqlite3 connection + pragmas (lazy singleton)
│   │   ├── env.ts           # shared DATA_DIR fallback — single source of truth
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

scripts/update.sh             # git pull + rebuild + recreate, for an existing deployment
```

`CLAUDE.md` has conventions for anyone (human or AI) picking this codebase back up.

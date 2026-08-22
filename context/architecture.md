# Personal Project Library — Architecture & Build Roadmap

> **Status:** Planning document / build reference
> **Companion document:** `project-management-software-idea.md` (product vision)
> **Deployment target:** Self-hosted Docker container on TrueNAS SCALE, reverse-proxied by Caddy, accessed at `projects.home.pikelabs.net` (or similar) from any device on the LAN.

This document is the technical execution plan. It is written so that any developer (human or AI assistant) can pick it up and understand what to build, in what order, with what technology, and why each decision was made.

---

## 1. Design Constraints (Non-Negotiable)

These come from the product owner and shape every decision below:

1. **Fully self-hosted.** No external services, no cloud dependencies, no telemetry. The app must work with zero internet access.
2. **Single Docker container.** Deployed via Docker Compose alongside existing apps. No multi-container orchestration (no separate database container, no Redis, no job queues).
3. **File-based backend.** All persistent data lives in one directory on the host, bind-mounted into the container. Backing up the app = copying one folder. Restoring = copying it back.
4. **Lightweight.** Target idle memory footprint under ~150 MB and near-zero idle CPU. Must run comfortably on a NAS alongside a dozen other services.
5. **Single user (or household).** No multi-tenant account system. Authentication can be minimal or delegated to the reverse proxy.
6. **LAN-accessible from any device.** The UI must be fully responsive (desktop, tablet, phone browser).

---

## 2. Storage Architecture — The Most Important Decision

The requirement is "a database I keep adding to through the web UI, stored as a file structure on the device." There are two honest ways to do this, and the recommendation is a **hybrid** of both.

### Option A: Pure flat files (Markdown + JSON)

Every project is a folder; notes are `.md` files; metadata is `.json` or YAML frontmatter.

- ✅ Human-readable forever; survives the app's death; grep-able; Git-friendly
- ❌ Search, filtering, sorting, and cross-project queries become slow and hand-rolled
- ❌ Concurrent writes (two browser tabs) risk corruption
- ❌ Every feature (tags, priorities, dates) requires inventing your own indexing

### Option B: SQLite

One database file holds everything.

- ✅ Real queries, full-text search (FTS5), transactions, integrity, speed
- ✅ Still literally a file on disk — it _is_ file-based storage
- ✅ Zero-config, no server process, battle-tested, tiny
- ❌ Not human-readable without a tool; feels less "open" than Markdown

### ✅ Recommended: Hybrid — SQLite for structure, filesystem for assets, Markdown for export

- **SQLite** (`library.db`) stores all structured data: projects, notes (as Markdown _text_ in the DB), tasks, progress updates, links, ideas, dates, tags.
- **Filesystem** stores all binary assets (images, PDFs, videos, design files) in per-project folders, referenced from the DB by relative path.
- **A built-in export function** writes the entire library out as a human-readable Markdown folder tree at any time (and can run automatically on a schedule). This gives the longevity and portability of flat files without sacrificing app capability.

This is the same pattern used by well-loved self-hosted apps (Mealie, Wiki.js, Joplin Server, Firefly III all use a DB + asset folder + export).

### On-disk layout (host side)

```
/mnt/Storage/apps/project-library/
├── docker-compose.yml
└── data/                      ← the ONE folder that matters; bind-mounted to /data
    ├── library.db             ← SQLite database (WAL mode)
    ├── library.db-wal         ← WAL journal (present during operation)
    ├── assets/
    │   ├── <project-uuid>/
    │   │   ├── <asset-uuid>-original-filename.jpg
    │   │   └── ...
    │   └── inbox/             ← assets attached to ideas before promotion
    ├── exports/               ← generated Markdown snapshots (optional retention)
    └── backups/               ← automatic .db snapshot copies (see §9)
```

---

## 3. Technology Stack

Chosen for: low resource use, single-container deployability, maintainability by a solo developer working with AI-assisted tooling, and a mainstream ecosystem.

| Layer           | Choice                                                                                                                             | Rationale                                                                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime         | **Node.js 22 LTS**                                                                                                                 | Single runtime for front + back; huge ecosystem; fine footprint for single-user                                                                         |
| Framework       | **SvelteKit** (Node adapter)                                                                                                       | Full-stack in one project: pages, API routes, and server logic together. Small bundles, fast, excellent DX. One `node build` process serves everything. |
| Database driver | **better-sqlite3**                                                                                                                 | Synchronous, fastest SQLite driver for Node, dead simple. Perfect for single-user.                                                                      |
| Search          | **SQLite FTS5**                                                                                                                    | Built-in full-text search across projects, notes, updates, ideas. No search service needed.                                                             |
| Styling         | **Tailwind CSS + Catppuccin Mocha palette**                                                                                        | Matches the Pike Labs aesthetic and existing brand guide. Use `@catppuccin/tailwindcss`.                                                                |
| Markdown        | **marked** (render) + **DOMPurify** (sanitize) or a Svelte Markdown component; **CodeMirror 6** for the editor (optional, phase 5) | Notes are written in Markdown, rendered pretty in the UI                                                                                                |
| Images          | **sharp**                                                                                                                          | Generate thumbnails on upload so galleries stay fast                                                                                                    |
| Auth            | Session cookie + single password (bcrypt hash in config), **or** none + Caddy `basic_auth` / Tailscale-only exposure               | Single-user; keep it simple. App-level login recommended so phones on the LAN aren't wide open.                                                         |
| Container       | Multi-stage Dockerfile → `node:22-alpine` runtime                                                                                  | Final image ~150 MB; idle RAM ~80–120 MB                                                                                                                |

**Deliberately excluded:** Postgres/MySQL (needless second container), Redis (no caching needs), any ORM heavier than a thin query layer (better-sqlite3 + hand-written SQL or Drizzle ORM if preferred), SSR-heavy meta-frameworks, Electron, cloud storage SDKs.

> **Acceptable alternative stack:** Go + HTMX + templ + modernc.org/sqlite compiles to a ~20 MB image with ~30 MB RAM. Choose this only if the developer strongly prefers Go; the SvelteKit path is recommended for iteration speed and UI richness.

---

## 4. Data Model

All IDs are UUIDv7 (time-sortable). All timestamps are ISO-8601 UTC. Schema managed by numbered migration files run at startup.

```sql
-- Categories: user-defined, orderable
categories (
  id TEXT PK, name TEXT NOT NULL, icon TEXT, color TEXT,
  sort_order INTEGER, created_at TEXT
)

-- Projects: the core entity
projects (
  id TEXT PK,
  title TEXT NOT NULL,
  category_id TEXT FK -> categories,
  status TEXT CHECK(status IN ('idea','active','paused','completed','archived')),
  priority TEXT CHECK(priority IN ('high','medium','low')),
  overview TEXT,               -- Markdown
  goals TEXT,                  -- Markdown
  cover_asset_id TEXT NULL,
  created_at TEXT, updated_at TEXT,
  paused_at TEXT NULL, completed_at TEXT NULL,
  -- Pause context (the "bookmark") — see §6.4
  pause_last_done TEXT NULL,
  pause_working_on TEXT NULL,
  pause_problems TEXT NULL,
  pause_next_steps TEXT NULL,
  -- Completion summary — see §6.6
  summary TEXT NULL            -- Markdown
)

-- Notes: multiple named Markdown documents per project
notes (
  id TEXT PK, project_id TEXT FK,
  title TEXT NOT NULL, body TEXT,          -- Markdown
  sort_order INTEGER, created_at TEXT, updated_at TEXT
)

-- Tasks: flat list per project with optional grouping
tasks (
  id TEXT PK, project_id TEXT FK,
  content TEXT NOT NULL,
  done INTEGER DEFAULT 0,
  group_name TEXT NULL,        -- e.g. "Phase 1", "Shopping list"
  sort_order INTEGER,
  due_date TEXT NULL,
  created_at TEXT, completed_at TEXT NULL
)

-- Progress updates: the chronological project journal
updates (
  id TEXT PK, project_id TEXT FK,
  body TEXT NOT NULL,          -- Markdown
  created_at TEXT
)

-- Important dates / milestones
dates (
  id TEXT PK, project_id TEXT FK,
  label TEXT NOT NULL, date TEXT NOT NULL,
  kind TEXT CHECK(kind IN ('deadline','milestone','appointment','seasonal','other')),
  notes TEXT NULL
)

-- Resources / external links
links (
  id TEXT PK, project_id TEXT FK,
  url TEXT NOT NULL, title TEXT, description TEXT,
  group_name TEXT NULL, created_at TEXT
)

-- Assets: files on disk, metadata in DB
assets (
  id TEXT PK, project_id TEXT FK,
  filename TEXT NOT NULL,      -- original name
  rel_path TEXT NOT NULL,      -- path under /data/assets/
  mime TEXT, size_bytes INTEGER,
  thumb_path TEXT NULL,        -- generated for images
  caption TEXT NULL, created_at TEXT
)

-- Idea inbox: pre-project captures
ideas (
  id TEXT PK,
  content TEXT NOT NULL,       -- one line or a paragraph
  notes TEXT NULL,
  created_at TEXT,
  promoted_project_id TEXT NULL  -- set when converted to a project
)

-- Tags (optional, phase 5+): flexible cross-category labeling
tags (id TEXT PK, name TEXT UNIQUE)
project_tags (project_id TEXT, tag_id TEXT, PK(project_id, tag_id))

-- Full-text search (FTS5 virtual table kept in sync via triggers)
search_index (entity_type, entity_id, project_id, title, body)
```

**Design notes:**

- _Ideas are not projects._ They live in their own table with almost no required structure. "Promoting" an idea creates a project and links back, preserving capture history.
- _Pause context lives on the project row_, not in a separate table — there is exactly one current bookmark per project, and setting a new one on re-pause overwrites it (the old context can be auto-appended as a progress update for history).
- _Duplication_ (§6.5) copies the project row + notes + tasks (reset to not-done) + links, and skips updates/assets by default (with checkboxes to include them).

---

## 5. Application Architecture

```
┌──────────────────────────── Browser (any LAN device) ───────────────────────────┐
│  SvelteKit front end — responsive UI, Catppuccin Mocha, Markdown rendering      │
└────────────────────────────────────┬────────────────────────────────────────────┘
                                     │ HTTPS
                       ┌─────────────▼──────────────┐
                       │  Caddy LXC (10.10.10.53)   │  projects.home.pikelabs.net
                       │  wildcard TLS, (basic_auth │  → reverse_proxy NAS:3015
                       │  optional)                 │
                       └─────────────┬──────────────┘
                                     │ HTTP (LAN)
┌────────────────────────────────────▼────────────────────────────────────────────┐
│  Docker container (TrueNAS SCALE)                     image: project-library    │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │ Node.js — SvelteKit server (single process)                              │   │
│  │  • Page routes (SSR + hydration)                                         │   │
│  │  • /api/* JSON endpoints                                                 │   │
│  │  • Auth middleware (session cookie)                                      │   │
│  │  • better-sqlite3 → /data/library.db (WAL mode)                          │   │
│  │  • Static asset serving → /data/assets (auth-gated)                      │   │
│  │  • sharp thumbnailing on upload                                          │   │
│  │  • Nightly backup + export scheduler (in-process cron)                   │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│  Volume: /mnt/Storage/apps/project-library/data  →  /data                        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

Key principles:

- **One process, one container, one volume.** No sidecars.
- **Server-rendered pages with light hydration.** Snappy on phones, low client-side weight.
- **All writes go through the API layer** with input validation (zod). The DB file is never touched by anything except the app (and read-only backup copies).
- **SQLite WAL mode** (`journal_mode=WAL`, `busy_timeout=5000`) so reads never block writes — safely handles multiple browser tabs/devices for a single household.

### API surface (REST, JSON)

```
POST   /api/auth/login              GET  /api/auth/logout
GET    /api/projects?status=&category=&priority=&q=
POST   /api/projects                GET/PATCH/DELETE /api/projects/:id
POST   /api/projects/:id/duplicate
POST   /api/projects/:id/pause     (body: the four bookmark fields)
POST   /api/projects/:id/resume
POST   /api/projects/:id/complete  (body: summary)
GET/POST        /api/projects/:id/notes      PATCH/DELETE /api/notes/:id
GET/POST        /api/projects/:id/tasks      PATCH/DELETE /api/tasks/:id
GET/POST        /api/projects/:id/updates    PATCH/DELETE /api/updates/:id
GET/POST        /api/projects/:id/dates      PATCH/DELETE /api/dates/:id
GET/POST        /api/projects/:id/links      PATCH/DELETE /api/links/:id
GET/POST(upload)/api/projects/:id/assets     DELETE /api/assets/:id
GET    /api/assets/:id/file         GET  /api/assets/:id/thumb
GET/POST /api/ideas                 PATCH/DELETE /api/ideas/:id
POST   /api/ideas/:id/promote
GET    /api/categories (+ CRUD)
GET    /api/search?q=               (FTS5 across everything)
POST   /api/export                  (trigger Markdown export)
GET    /api/health
```

---

## 6. Feature Specifications by Area

### 6.1 Library (home screen)

- Grid/list of project cards: cover image (or category icon), title, category chip, status badge, priority flag, "last touched" relative time.
- Filters: status, category, priority; sort by last-updated / created / title.
- Prominent global search box (FTS across titles, overviews, notes, updates, ideas).
- Visual distinction for **paused** projects — they are first-class, not buried.

### 6.2 Project workspace

Tabbed or sectioned single-page workspace per project:
**Overview · Goals · Tasks · Dates · Updates · Notes · Links · Assets**

- Overview/Goals: Markdown with inline edit.
- Tasks: checkboxes, optional groups, drag-reorder, optional due dates.
- Updates: reverse-chronological journal; composing an update is _one textarea and a button_ — friction here kills the habit.
- Notes: sidebar list of named documents; Markdown editor with preview.
- Links: title auto-fetch is a **non-goal** initially (self-hosted, offline-safe); paste URL + title manually.
- Assets: thumbnail grid, lightbox viewer, drag-and-drop upload, captions.

### 6.3 Resume banner

When opening a **paused** project, the pause bookmark renders as a banner at the top of the workspace before anything else: _last done / was working on / open problems / intended next steps_, plus the pause date ("Paused 4 months ago"). One click dismisses it into the Updates history and sets the project active.

### 6.4 Pause flow

"Pause project" opens a 4-field form (all optional but encouraged). On save: status→paused, fields stored, and a formatted copy appended as a progress update so the history is preserved even after resuming.

### 6.5 Duplicate project

Dialog with checkboxes: ☑ notes ☑ task lists (reset completion) ☑ links ☐ assets ☐ updates. Creates the new project in `active` (or `idea`) status with "(copy)" suffix, ready to rename.

### 6.6 Complete flow

"Mark complete" prompts for a summary (Markdown, template pre-filled with headings: _What it was / What was accomplished / Key decisions / Challenges / Useful resources / Lessons learned / Result_). Completed projects remain fully browsable and searchable — the library is the point.

### 6.7 Idea inbox

A single always-one-tap-away capture box (also on mobile home screen via PWA, see §10). Ideas list supports inline edit, delete, and **Promote → Project** (choose category, carries idea text into overview).

### 6.8 Export

On demand + nightly: write `/data/exports/<timestamp>/` containing one folder per project with `README.md` (overview, goals, dates, summary, pause context), `notes/*.md`, `tasks.md`, `updates.md`, `links.md`, and relative links into the shared assets folder. This is the escape hatch that keeps the data yours forever.

---

## 7. Non-Functional Requirements

| Concern         | Requirement                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------ |
| Idle RAM        | < 150 MB (expect ~80–120 MB)                                                                                       |
| Idle CPU        | ~0% (no polling loops; scheduler wakes 1×/night)                                                                   |
| Cold start      | < 5 s container start to first page                                                                                |
| Page loads      | < 300 ms server render on LAN for library of 500+ projects                                                         |
| Uploads         | Accept files up to a configurable limit (default 500 MB for video); stream to disk, never buffer whole file in RAM |
| Concurrency     | Safe for a handful of simultaneous household users (WAL + busy_timeout)                                            |
| Offline         | Fully functional with no internet access                                                                           |
| Data safety     | Atomic writes via SQLite transactions; nightly `VACUUM INTO` backup snapshot; export escape hatch                  |
| Browser support | Current Firefox / Chrome / Safari, including iOS Safari                                                            |

---

## 8. Docker & Deployment

### Dockerfile (multi-stage, sketch)

```dockerfile
# --- build stage ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

# --- runtime stage ---
FROM node:22-alpine
RUN apk add --no-cache vips        # for sharp
ENV NODE_ENV=production DATA_DIR=/data PORT=3000
WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json .
VOLUME /data
EXPOSE 3000
USER node
CMD ["node", "build"]
```

### docker-compose.yml (on TrueNAS, matching existing app conventions)

```yaml
services:
  project-library:
    image: project-library:latest # or ghcr.io/gab-pike/project-library
    container_name: project-library
    restart: unless-stopped
    ports:
      - "3015:3000" # pick any free host port
    volumes:
      - /mnt/Storage/apps/project-library/data:/data
    environment:
      - TZ=America/Chicago
      - AUTH_PASSWORD_HASH=${AUTH_PASSWORD_HASH} # bcrypt hash, from .env
      - SESSION_SECRET=${SESSION_SECRET}
      - MAX_UPLOAD_MB=500
    mem_limit: 512m
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:3000/api/health"]
      interval: 60s
      timeout: 5s
      retries: 3
```

### Caddy (on the Caddy LXC)

```caddy
projects.home.pikelabs.net {
    reverse_proxy 10.10.10.156:3015
    # optional belt-and-suspenders if skipping app auth:
    # basic_auth { gabby <bcrypt-hash> }
}
```

Pi-hole wildcard DNS for `*.home.pikelabs.net` already resolves this to Caddy; Tailscale split DNS makes it reachable remotely with zero extra work.

---

## 9. Backups & Data Longevity

Three independent layers:

1. **Nightly in-app snapshot:** scheduler runs `VACUUM INTO '/data/backups/library-YYYY-MM-DD.db'`; keep last 14, prune older. (`VACUUM INTO` produces a consistent copy safe to take while the app runs.)
2. **Nightly Markdown export** to `/data/exports/` (keep last 2), guaranteeing human-readable data even if SQLite tooling vanishes.
3. **Host-level:** the whole `data/` directory rides along with the existing TrueNAS snapshot/replication strategy like every other app under `/mnt/Storage/apps/`.

Restore procedure: stop container → replace `library.db` with a snapshot → start container. Documented in the repo README.

---

## 10. Build Roadmap (Phased Milestones)

Each phase produces a **usable, deployable app**. Ship and actually use it at the end of every phase — real usage will reshape later phases.

### Phase 0 — Foundation _(scaffolding)_

- SvelteKit project init, Tailwind + Catppuccin Mocha theme, base layout/nav
- SQLite bootstrapping: connection module, WAL pragmas, migration runner, schema v1 (categories, projects, ideas)
- Dockerfile + compose file; deploy "hello library" to TrueNAS behind Caddy
- ✅ _Exit criteria: themed empty app reachable at projects.home.pikelabs.net, data volume persists across container restarts_

### Phase 1 — Library core

- Category CRUD (with defaults seeded: Software, Photography, Home, Garden, Making, Research…)
- Project CRUD: create, edit overview/goals, status + priority, delete (soft-delete → `archived`)
- Library screen with cards, filters, sorting
- Idea inbox: capture, list, edit, delete, promote-to-project
- Simple session auth (login page, cookie, logout)
- ✅ _Exit criteria: daily-drivable for capturing ideas and cataloging existing projects_

### Phase 2 — Project workspace

- Notes: multiple named Markdown docs per project, editor + rendered preview
- Tasks: CRUD, checkboxes, groups, reorder
- Progress updates: journal composer + timeline
- Important dates: CRUD + display; "upcoming dates" strip on the library screen
- Links: CRUD with grouping
- ✅ _Exit criteria: a real project can be fully documented and worked from the app_

### Phase 3 — Pause / Resume / Lifecycle

- Pause flow (4-field bookmark) + paused status styling in library
- Resume banner on paused project open
- Complete flow with templated summary
- Duplicate project with options dialog
- ✅ _Exit criteria: the core differentiating loop — pause, forget, return, resume — works end to end_

### Phase 4 — Assets

- Upload endpoint (streaming to `/data/assets/<project-id>/`), size limits, mime allowlist
- sharp thumbnail generation for images; thumbnail grid + lightbox
- Captions; set-as-cover-image; delete (removes file + thumb + row)
- ✅ _Exit criteria: photos and files live with their projects_

### Phase 5 — Search, Export, Polish

- FTS5 index + triggers; global search UI with grouped results
- Markdown export (manual button + nightly), backup scheduler (`VACUUM INTO` + pruning)
- PWA manifest + icons (installable on phones; idea capture from home screen)
- Optional niceties: tags, keyboard shortcuts, richer Markdown editor (CodeMirror), dashboard widgets (recently touched, longest-paused, upcoming dates)
- ✅ _Exit criteria: v1.0 — search works, backups run themselves, data is exportable_

### Explicit non-goals for v1

Multi-user accounts, sharing/permissions, mobile native apps, real-time sync/collaboration, link-preview scraping, cloud anything, notifications, AI features. Any of these can be revisited _after_ v1 is in daily use.

---

## 11. Repository Layout

```
project-library/
├── src/
│   ├── lib/
│   │   ├── server/
│   │   │   ├── db.ts            # better-sqlite3 connection + pragmas
│   │   │   ├── migrations/      # 001_init.sql, 002_..., runner
│   │   │   ├── repos/           # projects.ts, notes.ts, tasks.ts, ... (SQL lives here)
│   │   │   ├── auth.ts          # session handling
│   │   │   ├── assets.ts        # upload streaming, sharp thumbnails
│   │   │   ├── export.ts        # Markdown export
│   │   │   └── scheduler.ts     # nightly backup/export
│   │   ├── components/          # ProjectCard, MarkdownView, TaskList, ...
│   │   └── types.ts             # shared TS types (zod schemas)
│   ├── routes/
│   │   ├── +layout.svelte       # nav shell, theme
│   │   ├── +page.svelte         # library home
│   │   ├── ideas/
│   │   ├── projects/[id]/       # workspace (+ nested note routes)
│   │   ├── login/
│   │   └── api/                 # all endpoints from §5
│   └── app.css                  # Tailwind + Catppuccin tokens
├── static/                      # favicon, PWA icons, manifest
├── Dockerfile
├── docker-compose.example.yml
├── CLAUDE.md                    # AI-assistant context (conventions, guardrails)
└── README.md                    # deploy, backup/restore, export docs
```

---

## 12. Key Decisions Log

| #   | Decision                                        | Alternatives considered     | Why                                                                                      |
| --- | ----------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | SQLite hybrid over pure flat files              | Markdown-only, JSON-only    | Search/queries/integrity; still one-folder portable; Markdown export preserves longevity |
| 2   | SvelteKit single process                        | Separate SPA + API, Go/HTMX | One codebase, one container, SSR speed on phones; Go noted as leaner fallback            |
| 3   | better-sqlite3, hand-rolled SQL in repo modules | Prisma, Sequelize           | Minimal overhead, transparent queries, no migration-tool lock-in                         |
| 4   | App-level session auth                          | Proxy-only auth, no auth    | Works on every device regardless of proxy config; proxy auth optional on top             |
| 5   | Assets on filesystem, not BLOBs                 | BLOBs in SQLite             | Keeps DB small/fast; files browsable and backup-friendly                                 |
| 6   | UUIDv7 keys                                     | Autoincrement ints          | Time-sortable, merge-safe for future export/import, no ID guessing                       |
| 7   | In-process nightly scheduler                    | Host cron, sidecar          | Single container constraint; survives inside the app's lifecycle                         |
| 8   | Link previews / scraping excluded from v1       | Auto-fetch titles           | Offline-first principle; avoids network dependencies and scope creep                     |

---

## 13. Glossary

- **Idea** — a captured thought with no structure; lives in the inbox until promoted or deleted.
- **Project** — a structured workspace with lifecycle status: `idea → active ⇄ paused → completed` (or `archived`).
- **Bookmark / pause context** — the four-field snapshot (last done, working on, problems, next steps) recorded when pausing.
- **Update** — a dated journal entry in a project's chronological history.
- **Note** — a named Markdown document within a project.
- **Summary** — the templated retrospective written at completion.
- **Export** — the on-disk Markdown mirror of the entire library.

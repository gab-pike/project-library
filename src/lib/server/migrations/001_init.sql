-- Phase 0 schema: categories, projects, ideas.
-- Later phases add notes, tasks, updates, dates, links, assets, tags, search_index
-- as additional numbered migration files (002_*, 003_*, ...).

CREATE TABLE categories (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	icon TEXT,
	color TEXT,
	sort_order INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL
);

CREATE TABLE projects (
	id TEXT PRIMARY KEY,
	title TEXT NOT NULL,
	category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
	status TEXT NOT NULL CHECK(status IN ('idea', 'active', 'paused', 'completed', 'archived')) DEFAULT 'active',
	priority TEXT NOT NULL CHECK(priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
	overview TEXT,
	goals TEXT,
	cover_asset_id TEXT,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	paused_at TEXT,
	completed_at TEXT,
	pause_last_done TEXT,
	pause_working_on TEXT,
	pause_problems TEXT,
	pause_next_steps TEXT,
	summary TEXT
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_category ON projects(category_id);

CREATE TABLE ideas (
	id TEXT PRIMARY KEY,
	content TEXT NOT NULL,
	notes TEXT,
	created_at TEXT NOT NULL,
	promoted_project_id TEXT REFERENCES projects(id) ON DELETE SET NULL
);

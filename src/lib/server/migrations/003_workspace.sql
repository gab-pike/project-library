-- Phase 2 schema: notes, tasks, updates, dates, links — the project workspace.

CREATE TABLE notes (
	id TEXT PRIMARY KEY,
	project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
	title TEXT NOT NULL,
	body TEXT,
	sort_order INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);
CREATE INDEX idx_notes_project ON notes(project_id);

CREATE TABLE tasks (
	id TEXT PRIMARY KEY,
	project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
	content TEXT NOT NULL,
	done INTEGER NOT NULL DEFAULT 0,
	group_name TEXT,
	sort_order INTEGER NOT NULL DEFAULT 0,
	due_date TEXT,
	created_at TEXT NOT NULL,
	completed_at TEXT
);
CREATE INDEX idx_tasks_project ON tasks(project_id);

CREATE TABLE updates (
	id TEXT PRIMARY KEY,
	project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
	body TEXT NOT NULL,
	created_at TEXT NOT NULL
);
CREATE INDEX idx_updates_project ON updates(project_id);

CREATE TABLE dates (
	id TEXT PRIMARY KEY,
	project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
	label TEXT NOT NULL,
	date TEXT NOT NULL,
	kind TEXT NOT NULL CHECK(kind IN ('deadline', 'milestone', 'appointment', 'seasonal', 'other')) DEFAULT 'other',
	notes TEXT
);
CREATE INDEX idx_dates_project ON dates(project_id);
CREATE INDEX idx_dates_date ON dates(date);

CREATE TABLE links (
	id TEXT PRIMARY KEY,
	project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
	url TEXT NOT NULL,
	title TEXT,
	description TEXT,
	group_name TEXT,
	created_at TEXT NOT NULL
);
CREATE INDEX idx_links_project ON links(project_id);

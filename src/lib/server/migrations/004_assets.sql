-- Phase 4 schema: assets — files/images that live on disk, referenced from the DB by relative path.

CREATE TABLE assets (
	id TEXT PRIMARY KEY,
	project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
	filename TEXT NOT NULL,
	rel_path TEXT NOT NULL,
	mime TEXT,
	size_bytes INTEGER,
	thumb_path TEXT,
	caption TEXT,
	created_at TEXT NOT NULL
);
CREATE INDEX idx_assets_project ON assets(project_id);

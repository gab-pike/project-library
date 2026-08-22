-- Phase 5 schema: FTS5 full-text search across projects, notes, updates, and ideas.
-- Kept in sync via triggers rather than FTS5 "external content" mode, since entity ids
-- here are TEXT uuids rather than integer rowids.

CREATE VIRTUAL TABLE search_index USING fts5(
	entity_type UNINDEXED,
	entity_id UNINDEXED,
	project_id UNINDEXED,
	title,
	body
);

-- Backfill existing rows.
INSERT INTO search_index (entity_type, entity_id, project_id, title, body)
SELECT 'project', id, id, title, COALESCE(overview, '') || ' ' || COALESCE(goals, '') FROM projects;

INSERT INTO search_index (entity_type, entity_id, project_id, title, body)
SELECT 'note', id, project_id, title, COALESCE(body, '') FROM notes;

INSERT INTO search_index (entity_type, entity_id, project_id, title, body)
SELECT 'update', id, project_id, '', body FROM updates;

INSERT INTO search_index (entity_type, entity_id, project_id, title, body)
SELECT 'idea', id, COALESCE(promoted_project_id, ''), content, COALESCE(notes, '') FROM ideas;

-- projects
CREATE TRIGGER trg_search_projects_ai AFTER INSERT ON projects BEGIN
	INSERT INTO search_index (entity_type, entity_id, project_id, title, body)
	VALUES ('project', new.id, new.id, new.title, COALESCE(new.overview, '') || ' ' || COALESCE(new.goals, ''));
END;

CREATE TRIGGER trg_search_projects_au AFTER UPDATE ON projects BEGIN
	DELETE FROM search_index WHERE entity_type = 'project' AND entity_id = old.id;
	INSERT INTO search_index (entity_type, entity_id, project_id, title, body)
	VALUES ('project', new.id, new.id, new.title, COALESCE(new.overview, '') || ' ' || COALESCE(new.goals, ''));
END;

CREATE TRIGGER trg_search_projects_ad AFTER DELETE ON projects BEGIN
	DELETE FROM search_index WHERE entity_type = 'project' AND entity_id = old.id;
END;

-- notes
CREATE TRIGGER trg_search_notes_ai AFTER INSERT ON notes BEGIN
	INSERT INTO search_index (entity_type, entity_id, project_id, title, body)
	VALUES ('note', new.id, new.project_id, new.title, COALESCE(new.body, ''));
END;

CREATE TRIGGER trg_search_notes_au AFTER UPDATE ON notes BEGIN
	DELETE FROM search_index WHERE entity_type = 'note' AND entity_id = old.id;
	INSERT INTO search_index (entity_type, entity_id, project_id, title, body)
	VALUES ('note', new.id, new.project_id, new.title, COALESCE(new.body, ''));
END;

CREATE TRIGGER trg_search_notes_ad AFTER DELETE ON notes BEGIN
	DELETE FROM search_index WHERE entity_type = 'note' AND entity_id = old.id;
END;

-- updates
CREATE TRIGGER trg_search_updates_ai AFTER INSERT ON updates BEGIN
	INSERT INTO search_index (entity_type, entity_id, project_id, title, body)
	VALUES ('update', new.id, new.project_id, '', new.body);
END;

CREATE TRIGGER trg_search_updates_au AFTER UPDATE ON updates BEGIN
	DELETE FROM search_index WHERE entity_type = 'update' AND entity_id = old.id;
	INSERT INTO search_index (entity_type, entity_id, project_id, title, body)
	VALUES ('update', new.id, new.project_id, '', new.body);
END;

CREATE TRIGGER trg_search_updates_ad AFTER DELETE ON updates BEGIN
	DELETE FROM search_index WHERE entity_type = 'update' AND entity_id = old.id;
END;

-- ideas
CREATE TRIGGER trg_search_ideas_ai AFTER INSERT ON ideas BEGIN
	INSERT INTO search_index (entity_type, entity_id, project_id, title, body)
	VALUES ('idea', new.id, COALESCE(new.promoted_project_id, ''), new.content, COALESCE(new.notes, ''));
END;

CREATE TRIGGER trg_search_ideas_au AFTER UPDATE ON ideas BEGIN
	DELETE FROM search_index WHERE entity_type = 'idea' AND entity_id = old.id;
	INSERT INTO search_index (entity_type, entity_id, project_id, title, body)
	VALUES ('idea', new.id, COALESCE(new.promoted_project_id, ''), new.content, COALESCE(new.notes, ''));
END;

CREATE TRIGGER trg_search_ideas_ad AFTER DELETE ON ideas BEGIN
	DELETE FROM search_index WHERE entity_type = 'idea' AND entity_id = old.id;
END;

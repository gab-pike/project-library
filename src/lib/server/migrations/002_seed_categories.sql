-- Default categories so the library isn't empty on first run.
-- Users can rename/delete/add their own afterward via the categories UI.
INSERT INTO categories (id, name, icon, color, sort_order, created_at) VALUES
	('00000000-0000-7000-8000-000000000001', 'Software', '💻', 'mauve', 0, '2026-01-01T00:00:00.000Z'),
	('00000000-0000-7000-8000-000000000002', 'Photography', '📷', 'pink', 1, '2026-01-01T00:00:00.000Z'),
	('00000000-0000-7000-8000-000000000003', 'Home', '🏠', 'peach', 2, '2026-01-01T00:00:00.000Z'),
	('00000000-0000-7000-8000-000000000004', 'Garden', '🌱', 'green', 3, '2026-01-01T00:00:00.000Z'),
	('00000000-0000-7000-8000-000000000005', 'Making', '🛠️', 'yellow', 4, '2026-01-01T00:00:00.000Z'),
	('00000000-0000-7000-8000-000000000006', 'Research', '🔬', 'blue', 5, '2026-01-01T00:00:00.000Z');

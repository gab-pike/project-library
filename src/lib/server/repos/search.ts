import db from '../db';

export type SearchEntityType = 'project' | 'note' | 'update' | 'idea';

export interface SearchResult {
	entity_type: SearchEntityType;
	entity_id: string;
	project_id: string;
	title: string;
	snippet: string;
}

// Turns free text into a safe FTS5 MATCH query: each token becomes a quoted phrase-prefix
// ("word"*), which sidesteps FTS5 operator syntax (OR, NOT, NEAR, unbalanced quotes, etc.)
// ever being interpreted from user input while still allowing partial-word matches.
function buildMatchQuery(raw: string): string | null {
	const tokens = raw
		.trim()
		.split(/\s+/)
		.map((t) => t.replace(/["*^]/g, ''))
		.filter(Boolean);
	if (tokens.length === 0) return null;
	return tokens.map((t) => `"${t}"*`).join(' ');
}

export function searchAll(query: string, limit = 30): SearchResult[] {
	const match = buildMatchQuery(query);
	if (!match) return [];

	return db
		.prepare(
			`SELECT entity_type, entity_id, project_id, title,
			        snippet(search_index, -1, '**', '**', '…', 12) AS snippet
			 FROM search_index
			 WHERE search_index MATCH ?
			 ORDER BY rank
			 LIMIT ?`
		)
		.all(match, limit) as SearchResult[];
}

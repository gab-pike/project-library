import { searchAll } from '$lib/server/repos/search';
import { getProject } from '$lib/server/repos/projects';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const results = searchAll(q);

	const projectTitles = new Map<string, string>();
	for (const r of results) {
		if (r.project_id && !projectTitles.has(r.project_id)) {
			const project = getProject(r.project_id);
			if (project) projectTitles.set(r.project_id, project.title);
		}
	}

	return { q, results, projectTitles: Object.fromEntries(projectTitles) };
};

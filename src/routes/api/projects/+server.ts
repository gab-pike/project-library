import { json } from '@sveltejs/kit';
import { createProject, listProjects } from '$lib/server/repos/projects';
import { ProjectCreateInput, ProjectPriority, ProjectStatus } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	const status = ProjectStatus.safeParse(url.searchParams.get('status')).data;
	const priority = ProjectPriority.safeParse(url.searchParams.get('priority')).data;
	const category_id = url.searchParams.get('category') ?? undefined;
	const q = url.searchParams.get('q') ?? undefined;

	return json(listProjects({ status, priority, category_id, q }));
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const parsed = ProjectCreateInput.safeParse(body);
	if (!parsed.success) {
		return json({ error: parsed.error.flatten() }, { status: 400 });
	}
	return json(createProject(parsed.data), { status: 201 });
};

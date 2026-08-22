import { error, json } from '@sveltejs/kit';
import { archiveProject, getProject, updateProject } from '$lib/server/repos/projects';
import { ProjectUpdateInput } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params }) => {
	const project = getProject(params.id);
	if (!project) error(404, 'Project not found');
	return json(project);
};

export const PATCH: RequestHandler = async ({ request, params }) => {
	const body = await request.json();
	const parsed = ProjectUpdateInput.safeParse(body);
	if (!parsed.success) {
		return json({ error: parsed.error.flatten() }, { status: 400 });
	}
	const updated = updateProject(params.id, parsed.data);
	if (!updated) error(404, 'Project not found');
	return json(updated);
};

// Soft-delete only — projects move to 'archived', they are never dropped from the API.
export const DELETE: RequestHandler = ({ params }) => {
	if (!getProject(params.id)) error(404, 'Project not found');
	return json(archiveProject(params.id));
};

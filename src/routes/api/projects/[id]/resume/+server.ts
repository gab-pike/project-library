import { error, json } from '@sveltejs/kit';
import { resumeProject } from '$lib/server/repos/projects';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ params }) => {
	const updated = resumeProject(params.id);
	if (!updated) error(404, 'Project not found');
	return json(updated);
};

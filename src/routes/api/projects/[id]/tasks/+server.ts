import { json } from '@sveltejs/kit';
import { createTask, listTasks } from '$lib/server/repos/tasks';
import { TaskCreateInput } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params }) => {
	return json(listTasks(params.id));
};

export const POST: RequestHandler = async ({ request, params }) => {
	const body = await request.json();
	const parsed = TaskCreateInput.safeParse(body);
	if (!parsed.success) return json({ error: parsed.error.flatten() }, { status: 400 });
	return json(createTask(params.id, parsed.data), { status: 201 });
};

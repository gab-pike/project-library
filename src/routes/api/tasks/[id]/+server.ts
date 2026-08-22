import { error, json } from '@sveltejs/kit';
import { deleteTask, getTask, setTaskDone, updateTask } from '$lib/server/repos/tasks';
import { TaskUpdateInput } from '$lib/types';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, params }) => {
	const body = await request.json();

	if (typeof body.done === 'boolean') {
		const updated = setTaskDone(params.id, body.done);
		if (!updated) error(404, 'Task not found');
		return json(updated);
	}

	const parsed = TaskUpdateInput.safeParse(body);
	if (!parsed.success) return json({ error: parsed.error.flatten() }, { status: 400 });
	const updated = updateTask(params.id, parsed.data);
	if (!updated) error(404, 'Task not found');
	return json(updated);
};

export const DELETE: RequestHandler = ({ params }) => {
	if (!getTask(params.id)) error(404, 'Task not found');
	deleteTask(params.id);
	return new Response(null, { status: 204 });
};

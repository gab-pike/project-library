import { error, json } from '@sveltejs/kit';
import { deleteNote, getNote, updateNote } from '$lib/server/repos/notes';
import { NoteUpdateInput } from '$lib/types';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, params }) => {
	const body = await request.json();
	const parsed = NoteUpdateInput.safeParse(body);
	if (!parsed.success) return json({ error: parsed.error.flatten() }, { status: 400 });
	const updated = updateNote(params.id, parsed.data);
	if (!updated) error(404, 'Note not found');
	return json(updated);
};

export const DELETE: RequestHandler = ({ params }) => {
	if (!getNote(params.id)) error(404, 'Note not found');
	deleteNote(params.id);
	return new Response(null, { status: 204 });
};

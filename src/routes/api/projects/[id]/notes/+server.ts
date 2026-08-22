import { json } from '@sveltejs/kit';
import { createNote, listNotes } from '$lib/server/repos/notes';
import { NoteCreateInput } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params }) => {
	return json(listNotes(params.id));
};

export const POST: RequestHandler = async ({ request, params }) => {
	const body = await request.json();
	const parsed = NoteCreateInput.safeParse(body);
	if (!parsed.success) return json({ error: parsed.error.flatten() }, { status: 400 });
	return json(createNote(params.id, parsed.data), { status: 201 });
};

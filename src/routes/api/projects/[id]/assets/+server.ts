import { json } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import { createAsset, listAssets } from '$lib/server/repos/assets';
import { saveUpload, UploadError } from '$lib/server/assets';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params }) => {
	return json(listAssets(params.id));
};

export const POST: RequestHandler = async ({ request, params }) => {
	const formData = await request.formData();
	const file = formData.get('file');
	if (!(file instanceof File) || file.size === 0) {
		return json({ error: 'No file provided' }, { status: 400 });
	}
	const caption = formData.get('caption');

	try {
		const id = randomUUID();
		const saved = await saveUpload(id, params.id, file);
		const asset = createAsset(id, params.id, {
			...saved,
			caption: typeof caption === 'string' && caption ? caption : null
		});
		return json(asset, { status: 201 });
	} catch (err) {
		if (err instanceof UploadError) return json({ error: err.message }, { status: 400 });
		throw err;
	}
};

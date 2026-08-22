import { error, json } from '@sveltejs/kit';
import { deleteAssetAndClearCover, getAsset, updateAssetCaption } from '$lib/server/repos/assets';
import { deleteUploadFiles } from '$lib/server/assets';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, params }) => {
	const body = await request.json();
	const caption = typeof body.caption === 'string' ? body.caption : null;
	const updated = updateAssetCaption(params.id, caption);
	if (!updated) error(404, 'Asset not found');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const asset = getAsset(params.id);
	if (!asset) error(404, 'Asset not found');
	await deleteUploadFiles(asset.rel_path, asset.thumb_path);
	deleteAssetAndClearCover(params.id);
	return new Response(null, { status: 204 });
};

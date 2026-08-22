import fs from 'fs';
import { Readable } from 'stream';
import { error } from '@sveltejs/kit';
import { getAsset } from '$lib/server/repos/assets';
import { absoluteAssetPath } from '$lib/server/assets';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const asset = getAsset(params.id);
	if (!asset?.thumb_path) error(404, 'No thumbnail');

	const absPath = absoluteAssetPath(asset.thumb_path);
	const stat = await fs.promises.stat(absPath).catch(() => null);
	if (!stat) error(404, 'Thumbnail missing on disk');

	return new Response(Readable.toWeb(fs.createReadStream(absPath)) as ReadableStream, {
		headers: {
			'Content-Type': 'image/webp',
			'Content-Length': String(stat.size),
			'Cache-Control': 'private, max-age=86400'
		}
	});
};

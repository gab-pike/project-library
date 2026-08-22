import fs from 'fs';
import { Readable } from 'stream';
import { error } from '@sveltejs/kit';
import { getAsset } from '$lib/server/repos/assets';
import { absoluteAssetPath } from '$lib/server/assets';
import type { RequestHandler } from './$types';

// Only these types render inline (in an <img>/<video>/PDF viewer); everything else forces a
// download so nothing the browser can't safely display just opens as a raw byte stream.
const INLINE_PREFIXES = ['image/', 'video/'];

export const GET: RequestHandler = async ({ params }) => {
	const asset = getAsset(params.id);
	if (!asset) error(404, 'Asset not found');

	const absPath = absoluteAssetPath(asset.rel_path);
	const stat = await fs.promises.stat(absPath).catch(() => null);
	if (!stat) error(404, 'File missing on disk');

	const mime = asset.mime ?? 'application/octet-stream';
	const inline = INLINE_PREFIXES.some((p) => mime.startsWith(p)) || mime === 'application/pdf';

	return new Response(Readable.toWeb(fs.createReadStream(absPath)) as ReadableStream, {
		headers: {
			'Content-Type': mime,
			'Content-Length': String(stat.size),
			'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(asset.filename)}"`,
			'Cache-Control': 'private, max-age=3600'
		}
	});
};

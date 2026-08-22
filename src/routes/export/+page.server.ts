import fs from 'fs/promises';
import { EXPORTS_DIR, runExport } from '$lib/server/export';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const entries = await fs.readdir(EXPORTS_DIR).catch(() => [] as string[]);
	return { exports: entries.sort().reverse() };
};

export const actions: Actions = {
	run: async () => {
		const dir = await runExport();
		return { ranAt: dir };
	}
};

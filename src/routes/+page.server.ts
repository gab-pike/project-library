import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const counts = {
		categories: (db.prepare('SELECT COUNT(*) AS n FROM categories').get() as { n: number }).n,
		projects: (db.prepare('SELECT COUNT(*) AS n FROM projects').get() as { n: number }).n,
		ideas: (db.prepare('SELECT COUNT(*) AS n FROM ideas').get() as { n: number }).n
	};

	return { counts };
};

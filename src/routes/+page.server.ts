import { listCategories } from '$lib/server/repos/categories';
import { listUpcomingDates } from '$lib/server/repos/dates';
import { listProjects } from '$lib/server/repos/projects';
import { ProjectPriority, ProjectStatus } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const status = ProjectStatus.safeParse(url.searchParams.get('status')).data;
	const priority = ProjectPriority.safeParse(url.searchParams.get('priority')).data;
	const category_id = url.searchParams.get('category') ?? undefined;
	const q = url.searchParams.get('q') ?? undefined;

	return {
		projects: listProjects({ status, priority, category_id, q }),
		categories: listCategories(),
		upcomingDates: listUpcomingDates(5),
		filters: {
			status: status ?? '',
			priority: priority ?? '',
			category: category_id ?? '',
			q: q ?? ''
		}
	};
};

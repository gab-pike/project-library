import { z } from 'zod';

// HTML forms submit unset optional fields as "" rather than omitting them — normalize to null
// so repos can rely on a consistent null/absent distinction regardless of the request source.
const optionalText = (max = 2000) =>
	z.preprocess((v) => (v === '' ? null : v), z.string().trim().max(max).nullable().optional());

export const ProjectStatus = z.enum(['idea', 'active', 'paused', 'completed', 'archived']);
export const ProjectPriority = z.enum(['high', 'medium', 'low']);

export const CategoryCreateInput = z.object({
	name: z.string().trim().min(1).max(100),
	icon: z.string().trim().max(10).nullable().optional(),
	color: z.string().trim().max(30).nullable().optional()
});
export const CategoryUpdateInput = CategoryCreateInput.partial();

export const ProjectCreateInput = z.object({
	title: z.string().trim().min(1).max(200),
	category_id: z.string().nullable().optional(),
	status: ProjectStatus.optional(),
	priority: ProjectPriority.optional(),
	overview: z.string().nullable().optional(),
	goals: z.string().nullable().optional()
});
export const ProjectUpdateInput = ProjectCreateInput.partial();

export const IdeaCreateInput = z.object({
	content: z.string().trim().min(1).max(2000),
	notes: z.string().nullable().optional()
});
export const IdeaUpdateInput = IdeaCreateInput.partial();

export const IdeaPromoteInput = z.object({
	category_id: z.string().nullable().optional()
});

export const NoteCreateInput = z.object({
	title: z.string().trim().min(1).max(200),
	body: optionalText(50_000)
});
export const NoteUpdateInput = NoteCreateInput.partial();

export const TaskCreateInput = z.object({
	content: z.string().trim().min(1).max(500),
	group_name: optionalText(100),
	due_date: optionalText(40)
});
export const TaskUpdateInput = TaskCreateInput.partial();

export const UpdateCreateInput = z.object({
	body: z.string().trim().min(1).max(5000)
});

export const DateKind = z.enum(['deadline', 'milestone', 'appointment', 'seasonal', 'other']);
export const DateCreateInput = z.object({
	label: z.string().trim().min(1).max(200),
	date: z.string().trim().min(1).max(40),
	kind: DateKind.optional(),
	notes: optionalText(2000)
});
export const DateUpdateInput = DateCreateInput.partial();

export const LinkCreateInput = z.object({
	url: z.string().trim().min(1).max(2000),
	title: optionalText(200),
	description: optionalText(2000),
	group_name: optionalText(100)
});
export const LinkUpdateInput = LinkCreateInput.partial();

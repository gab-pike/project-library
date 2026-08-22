import { z } from 'zod';

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

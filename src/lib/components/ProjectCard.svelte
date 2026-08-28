<script lang="ts">
	import type { Project } from '$lib/server/repos/projects';
	import type { Category } from '$lib/server/repos/categories';
	import { relativeTime } from '$lib/format';
	import { categoryAccentClass, priorityClass, statusBadgeClass, statusBorderClass } from '$lib/accent';

	let { project, category }: { project: Project; category: Category | undefined } = $props();
</script>

<a
	href="/projects/{project.id}"
	class="flex flex-col gap-2 rounded-lg border border-l-4 border-ctp-surface0 bg-ctp-mantle p-4 transition hover:border-ctp-mauve {statusBorderClass(project.status)}"
>
	{#if project.cover_asset_id}
		<img
			src="/api/assets/{project.cover_asset_id}/thumb"
			alt=""
			class="-mx-4 -mt-4 mb-1 aspect-video w-[calc(100%+2rem)] rounded-t-lg object-cover"
		/>
	{/if}

	<div class="flex items-start justify-between gap-2">
		<h3 class="font-display font-semibold text-ctp-text">{project.title}</h3>
		<span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium {statusBadgeClass(project.status)}">
			{project.status}
		</span>
	</div>

	{#if category}
		<p class="text-sm {categoryAccentClass(category.color)}">
			{category.icon ?? ''} {category.name}
		</p>
	{/if}

	{#if project.overview}
		<p class="line-clamp-2 text-sm text-ctp-subtext1">{project.overview}</p>
	{/if}

	<div class="mt-1 flex items-center justify-between text-xs text-ctp-subtext0">
		<span class="font-mono font-medium {priorityClass(project.priority)}">{project.priority} priority</span>
		<span class="font-mono">{relativeTime(project.updated_at)}</span>
	</div>
</a>

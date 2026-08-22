<script lang="ts">
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const categoryById = $derived(new Map(data.categories.map((c) => [c.id, c])));
</script>

<svelte:head>
	<title>Project Library</title>
</svelte:head>

<div class="mb-6 flex items-center justify-between gap-4">
	<h1 class="text-2xl font-semibold text-ctp-text">Your Project Library</h1>
	<a href="/projects/new" class="rounded-md bg-ctp-mauve px-3 py-2 text-sm font-medium text-ctp-base hover:opacity-90">
		+ New project
	</a>
</div>

<form method="GET" class="mb-6 flex flex-wrap gap-3">
	<input
		type="search"
		name="q"
		value={data.filters.q}
		placeholder="Search title & overview…"
		class="min-w-48 flex-1 rounded-md border border-ctp-surface0 bg-ctp-mantle px-3 py-1.5 text-sm text-ctp-text outline-none focus:border-ctp-mauve"
	/>
	<select
		name="status"
		class="rounded-md border border-ctp-surface0 bg-ctp-mantle px-3 py-1.5 text-sm text-ctp-text"
	>
		<option value="" selected={data.filters.status === ''}>All statuses</option>
		{#each ['idea', 'active', 'paused', 'completed', 'archived'] as s (s)}
			<option value={s} selected={data.filters.status === s}>{s}</option>
		{/each}
	</select>
	<select
		name="priority"
		class="rounded-md border border-ctp-surface0 bg-ctp-mantle px-3 py-1.5 text-sm text-ctp-text"
	>
		<option value="" selected={data.filters.priority === ''}>All priorities</option>
		{#each ['high', 'medium', 'low'] as p (p)}
			<option value={p} selected={data.filters.priority === p}>{p}</option>
		{/each}
	</select>
	<select
		name="category"
		class="rounded-md border border-ctp-surface0 bg-ctp-mantle px-3 py-1.5 text-sm text-ctp-text"
	>
		<option value="" selected={data.filters.category === ''}>All categories</option>
		{#each data.categories as c (c.id)}
			<option value={c.id} selected={data.filters.category === c.id}>{c.icon} {c.name}</option>
		{/each}
	</select>
	<button
		type="submit"
		class="rounded-md border border-ctp-surface0 px-3 py-1.5 text-sm text-ctp-subtext1 hover:text-ctp-text"
	>
		Filter
	</button>
</form>

{#if data.projects.length === 0}
	<p class="rounded-lg border border-dashed border-ctp-surface0 p-8 text-center text-ctp-subtext1">
		No projects match these filters yet.
	</p>
{:else}
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.projects as project (project.id)}
			<ProjectCard {project} category={categoryById.get(project.category_id ?? '')} />
		{/each}
	</div>
{/if}

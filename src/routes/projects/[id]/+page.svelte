<script lang="ts">
	import { enhance } from '$app/forms';
	import { statusBadgeClass } from '$lib/accent';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const values = $derived(form?.values ?? data.project);
</script>

<svelte:head>
	<title>{data.project.title} — Project Library</title>
</svelte:head>

<div class="mb-6 flex items-center gap-3">
	<h1 class="text-2xl font-semibold text-ctp-text">{data.project.title}</h1>
	<span class="rounded-full px-2 py-0.5 text-xs font-medium {statusBadgeClass(data.project.status)}">
		{data.project.status}
	</span>
</div>

<form method="POST" action="?/update" use:enhance class="flex max-w-xl flex-col gap-4">
	<label class="flex flex-col gap-1">
		<span class="text-sm text-ctp-subtext1">Title</span>
		<input
			name="title"
			required
			value={values.title}
			class="rounded-md border border-ctp-surface0 bg-ctp-mantle px-3 py-2 text-ctp-text outline-none focus:border-ctp-mauve"
		/>
		{#if form?.error?.title}<p class="text-sm text-ctp-red">{form.error.title[0]}</p>{/if}
	</label>

	<label class="flex flex-col gap-1">
		<span class="text-sm text-ctp-subtext1">Category</span>
		<select
			name="category_id"
			class="rounded-md border border-ctp-surface0 bg-ctp-mantle px-3 py-2 text-ctp-text"
		>
			<option value="">No category</option>
			{#each data.categories as c (c.id)}
				<option value={c.id} selected={values.category_id === c.id}>{c.icon} {c.name}</option>
			{/each}
		</select>
	</label>

	<div class="flex gap-4">
		<label class="flex flex-1 flex-col gap-1">
			<span class="text-sm text-ctp-subtext1">Status</span>
			<select
				name="status"
				class="rounded-md border border-ctp-surface0 bg-ctp-mantle px-3 py-2 text-ctp-text"
			>
				{#each ['idea', 'active', 'paused', 'completed', 'archived'] as s (s)}
					<option value={s} selected={values.status === s}>{s}</option>
				{/each}
			</select>
		</label>
		<label class="flex flex-1 flex-col gap-1">
			<span class="text-sm text-ctp-subtext1">Priority</span>
			<select
				name="priority"
				class="rounded-md border border-ctp-surface0 bg-ctp-mantle px-3 py-2 text-ctp-text"
			>
				{#each ['high', 'medium', 'low'] as p (p)}
					<option value={p} selected={values.priority === p}>{p}</option>
				{/each}
			</select>
		</label>
	</div>

	<label class="flex flex-col gap-1">
		<span class="text-sm text-ctp-subtext1">Overview</span>
		<textarea
			name="overview"
			rows="6"
			class="rounded-md border border-ctp-surface0 bg-ctp-mantle px-3 py-2 text-ctp-text outline-none focus:border-ctp-mauve"
		>{values.overview ?? ''}</textarea>
	</label>

	<label class="flex flex-col gap-1">
		<span class="text-sm text-ctp-subtext1">Goals</span>
		<textarea
			name="goals"
			rows="4"
			class="rounded-md border border-ctp-surface0 bg-ctp-mantle px-3 py-2 text-ctp-text outline-none focus:border-ctp-mauve"
		>{values.goals ?? ''}</textarea>
	</label>

	<div class="flex items-center gap-3">
		<button
			type="submit"
			class="rounded-md bg-ctp-mauve px-4 py-2 font-medium text-ctp-base hover:opacity-90"
		>
			Save
		</button>
		{#if form?.saved}<span class="text-sm text-ctp-green">Saved.</span>{/if}
	</div>
</form>

<form
	method="POST"
	action="?/archive"
	use:enhance
	class="mt-8 border-t border-ctp-surface0 pt-4"
>
	<button type="submit" class="text-sm text-ctp-red hover:underline">
		Archive this project
	</button>
</form>

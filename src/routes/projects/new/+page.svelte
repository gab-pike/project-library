<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>New project — Project Library</title>
</svelte:head>

<h1 class="font-display mb-6 text-2xl font-semibold text-ctp-text">New project</h1>

<form method="POST" use:enhance class="flex max-w-xl flex-col gap-4">
	<label class="flex flex-col gap-1">
		<span class="text-sm text-ctp-subtext1">Title</span>
		<input
			name="title"
			required
			value={form?.values?.title ?? ''}
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
				<option value={c.id}>{c.icon} {c.name}</option>
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
				<option value="idea">idea</option>
				<option value="active" selected>active</option>
				<option value="paused">paused</option>
			</select>
		</label>
		<label class="flex flex-1 flex-col gap-1">
			<span class="text-sm text-ctp-subtext1">Priority</span>
			<select
				name="priority"
				class="rounded-md border border-ctp-surface0 bg-ctp-mantle px-3 py-2 text-ctp-text"
			>
				<option value="high">high</option>
				<option value="medium" selected>medium</option>
				<option value="low">low</option>
			</select>
		</label>
	</div>

	<label class="flex flex-col gap-1">
		<span class="text-sm text-ctp-subtext1">Overview</span>
		<textarea
			name="overview"
			rows="4"
			class="rounded-md border border-ctp-surface0 bg-ctp-mantle px-3 py-2 text-ctp-text outline-none focus:border-ctp-mauve"
		>{form?.values?.overview ?? ''}</textarea>
	</label>

	<label class="flex flex-col gap-1">
		<span class="text-sm text-ctp-subtext1">Goals</span>
		<textarea
			name="goals"
			rows="3"
			class="rounded-md border border-ctp-surface0 bg-ctp-mantle px-3 py-2 text-ctp-text outline-none focus:border-ctp-mauve"
		>{form?.values?.goals ?? ''}</textarea>
	</label>

	<button
		type="submit"
		class="self-start rounded-md bg-ctp-mauve px-4 py-2 font-medium text-ctp-crust hover:opacity-90"
	>
		Create project
	</button>
</form>

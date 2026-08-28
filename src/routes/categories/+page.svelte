<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>Categories — Project Library</title>
</svelte:head>

<h1 class="font-display mb-6 text-2xl font-semibold text-ctp-text">Categories</h1>

<ul class="mb-8 flex max-w-md flex-col gap-2">
	{#each data.categories as c (c.id)}
		<li class="flex items-center justify-between rounded-md border border-ctp-surface0 bg-ctp-mantle px-3 py-2">
			<span class="text-ctp-text">{c.icon} {c.name}</span>
			<form method="POST" action="?/delete" use:enhance>
				<input type="hidden" name="id" value={c.id} />
				<button type="submit" class="text-sm text-ctp-red hover:underline">Delete</button>
			</form>
		</li>
	{/each}
</ul>

<form method="POST" action="?/create" use:enhance class="flex max-w-md items-end gap-2">
	<label class="flex flex-col gap-1">
		<span class="text-sm text-ctp-subtext1">Icon</span>
		<input
			name="icon"
			maxlength="4"
			class="w-16 rounded-md border border-ctp-surface0 bg-ctp-mantle px-2 py-1.5 text-center text-ctp-text"
		/>
	</label>
	<label class="flex flex-1 flex-col gap-1">
		<span class="text-sm text-ctp-subtext1">Name</span>
		<input
			name="name"
			required
			class="rounded-md border border-ctp-surface0 bg-ctp-mantle px-3 py-1.5 text-ctp-text"
		/>
	</label>
	<button type="submit" class="rounded-md bg-ctp-mauve px-3 py-1.5 font-medium text-ctp-crust hover:opacity-90">
		Add
	</button>
</form>
{#if form?.error?.name}<p class="mt-2 text-sm text-ctp-red">{form.error.name[0]}</p>{/if}

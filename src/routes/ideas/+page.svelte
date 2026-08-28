<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>Ideas — Project Library</title>
</svelte:head>

<h1 class="font-display mb-6 text-2xl font-semibold text-ctp-text">Idea inbox</h1>

<form method="POST" action="?/create" use:enhance class="mb-8 flex max-w-xl flex-col gap-2">
	<textarea
		name="content"
		rows="2"
		required
		placeholder="Capture a project idea…"
		class="rounded-md border border-ctp-surface0 bg-ctp-mantle px-3 py-2 text-ctp-text outline-none focus:border-ctp-mauve"
	></textarea>
	{#if form?.error?.content}<p class="text-sm text-ctp-red">{form.error.content[0]}</p>{/if}
	<button
		type="submit"
		class="self-start rounded-md bg-ctp-mauve px-3 py-1.5 text-sm font-medium text-ctp-crust hover:opacity-90"
	>
		Capture
	</button>
</form>

{#if data.ideas.length === 0}
	<p class="text-ctp-subtext1">No ideas yet — capture one above.</p>
{:else}
	<ul class="flex max-w-xl flex-col gap-3">
		{#each data.ideas as idea (idea.id)}
			<li class="rounded-lg border border-ctp-surface0 bg-ctp-mantle p-4">
				<p class="text-ctp-text">{idea.content}</p>
				{#if idea.notes}<p class="mt-1 text-sm text-ctp-subtext1">{idea.notes}</p>{/if}

				<div class="mt-3 flex flex-wrap items-center gap-3 text-sm">
					<details class="grow">
						<summary class="cursor-pointer text-ctp-subtext1 hover:text-ctp-text">Edit</summary>
						<form method="POST" action="?/update" use:enhance class="mt-2 flex flex-col gap-2">
							<input type="hidden" name="id" value={idea.id} />
							<textarea
								name="content"
								rows="2"
								required
								class="rounded-md border border-ctp-surface0 bg-ctp-base px-2 py-1 text-ctp-text"
								>{idea.content}</textarea
							>
							<input
								name="notes"
								value={idea.notes ?? ''}
								placeholder="Notes (optional)"
								class="rounded-md border border-ctp-surface0 bg-ctp-base px-2 py-1 text-ctp-text"
							/>
							<button
								type="submit"
								class="self-start rounded-md border border-ctp-surface0 px-2 py-1 text-ctp-subtext1 hover:text-ctp-text"
							>
								Save
							</button>
						</form>
					</details>

					<form method="POST" action="?/promote" use:enhance class="flex items-center gap-2">
						<input type="hidden" name="id" value={idea.id} />
						<select name="category_id" class="rounded-md border border-ctp-surface0 bg-ctp-base px-2 py-1 text-ctp-text">
							<option value="">No category</option>
							{#each data.categories as c (c.id)}
								<option value={c.id}>{c.icon} {c.name}</option>
							{/each}
						</select>
						<button type="submit" class="text-ctp-green hover:underline">Promote → Project</button>
					</form>

					<form method="POST" action="?/delete" use:enhance>
						<input type="hidden" name="id" value={idea.id} />
						<button type="submit" class="text-ctp-red hover:underline">Delete</button>
					</form>
				</div>
			</li>
		{/each}
	</ul>
{/if}

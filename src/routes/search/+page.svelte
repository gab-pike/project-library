<script lang="ts">
	import { splitSnippet } from '$lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const ENTITY_LABELS: Record<string, string> = {
		project: 'Projects',
		note: 'Notes',
		update: 'Updates',
		idea: 'Ideas'
	};

	const grouped = $derived.by(() => {
		const groups = new Map<string, typeof data.results>();
		for (const r of data.results) {
			if (!groups.has(r.entity_type)) groups.set(r.entity_type, []);
			groups.get(r.entity_type)!.push(r);
		}
		return [...groups.entries()];
	});

	function linkFor(result: (typeof data.results)[number]): string {
		if (result.entity_type === 'idea' && !result.project_id) return '/ideas';
		return `/projects/${result.project_id}`;
	}
</script>

<svelte:head>
	<title>Search — Project Library</title>
</svelte:head>

<h1 class="mb-6 text-2xl font-semibold text-ctp-text">Search</h1>

<form method="GET" class="mb-6 flex gap-2">
	<input
		type="search"
		name="q"
		value={data.q}
		placeholder="Search projects, notes, updates, ideas…"
		class="w-full max-w-xl rounded-md border border-ctp-surface0 bg-ctp-mantle px-3 py-2 text-ctp-text outline-none focus:border-ctp-mauve"
	/>
	<button type="submit" class="rounded-md bg-ctp-mauve px-4 py-2 text-sm font-medium text-ctp-base hover:opacity-90">
		Search
	</button>
</form>

{#if data.q && data.results.length === 0}
	<p class="text-ctp-subtext1">No results for "{data.q}".</p>
{/if}

{#each grouped as [type, results] (type)}
	<h2 class="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-ctp-subtext1 first:mt-0">
		{ENTITY_LABELS[type] ?? type}
	</h2>
	<ul class="flex flex-col gap-2">
		{#each results as result (result.entity_id)}
			<li>
				<a href={linkFor(result)} class="block rounded-md border border-ctp-surface0 bg-ctp-mantle p-3 hover:border-ctp-mauve">
					<div class="flex items-center justify-between gap-2">
						<span class="font-medium text-ctp-text">{result.title || '(untitled)'}</span>
						{#if result.project_id && data.projectTitles[result.project_id] && type !== 'project'}
							<span class="text-xs text-ctp-subtext0">{data.projectTitles[result.project_id]}</span>
						{/if}
					</div>
					<p class="mt-1 text-sm text-ctp-subtext1">
						{#each splitSnippet(result.snippet) as seg, i (i)}
							{#if seg.hit}<mark class="rounded bg-ctp-mauve/30 text-ctp-text">{seg.text}</mark>{:else}{seg.text}{/if}
						{/each}
					</p>
				</a>
			</li>
		{/each}
	</ul>
{/each}

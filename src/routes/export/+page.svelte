<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: { data: PageProps['data']; form: any } = $props();
</script>

<svelte:head>
	<title>Export & Backups — Project Library</title>
</svelte:head>

<h1 class="mb-2 text-2xl font-semibold text-ctp-text">Export &amp; backups</h1>
<p class="mb-6 max-w-xl text-sm text-ctp-subtext1">
	Exports write the whole library out as a human-readable Markdown folder tree under
	<code class="rounded bg-ctp-surface0 px-1">data/exports/</code> — this is the escape hatch that
	keeps your data yours even if this app goes away someday. A backup (SQLite snapshot) and an
	export both run automatically every night at 2am server time; the last 14 backups and 2
	exports are kept.
</p>

<form method="POST" action="?/run" use:enhance class="mb-6">
	<button type="submit" class="rounded-md bg-ctp-mauve px-4 py-2 text-sm font-medium text-ctp-base hover:opacity-90">
		Run export now
	</button>
</form>

{#if form?.ranAt}
	<p class="mb-6 text-sm text-ctp-green">Export written to {form.ranAt}</p>
{/if}

<h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-ctp-subtext1">Past exports</h2>
{#if data.exports.length === 0}
	<p class="text-ctp-subtext1">No exports yet.</p>
{:else}
	<ul class="flex flex-col gap-1 text-sm">
		{#each data.exports as name (name)}
			<li class="text-ctp-text">{name}</li>
		{/each}
	</ul>
{/if}

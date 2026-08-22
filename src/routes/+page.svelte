<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Project Library</title>
</svelte:head>

<section class="flex flex-col gap-2">
	<h1 class="text-2xl font-semibold text-ctp-text">Your Project Library</h1>
	<p class="text-ctp-subtext1">
		Phase 0 foundation is live — SvelteKit, SQLite, and the Catppuccin Mocha theme are wired up.
		Library cards, filters, and the idea inbox arrive in Phase 1.
	</p>
</section>

<section class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
	<div class="rounded-lg border border-ctp-surface0 bg-ctp-mantle p-4">
		<p class="text-sm text-ctp-subtext0">Categories</p>
		<p class="text-3xl font-semibold text-ctp-mauve">{data.counts.categories}</p>
	</div>
	<div class="rounded-lg border border-ctp-surface0 bg-ctp-mantle p-4">
		<p class="text-sm text-ctp-subtext0">Projects</p>
		<p class="text-3xl font-semibold text-ctp-green">{data.counts.projects}</p>
	</div>
	<div class="rounded-lg border border-ctp-surface0 bg-ctp-mantle p-4">
		<p class="text-sm text-ctp-subtext0">Ideas</p>
		<p class="text-3xl font-semibold text-ctp-peach">{data.counts.ideas}</p>
	</div>
</section>

<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Log in — Project Library</title>
</svelte:head>

<div class="mx-auto mt-16 max-w-sm">
	<h1 class="font-display mb-6 text-xl font-semibold text-ctp-text">Project Library</h1>
	<form method="POST" use:enhance class="flex flex-col gap-3">
		<label class="flex flex-col gap-1">
			<span class="text-sm text-ctp-subtext1">Password</span>
			<input
				type="password"
				name="password"
				autocomplete="current-password"
				required
				class="rounded-md border border-ctp-surface0 bg-ctp-mantle px-3 py-2 text-ctp-text outline-none focus:border-ctp-mauve"
			/>
		</label>
		{#if form?.error}
			<p class="text-sm text-ctp-red">{form.error}</p>
		{/if}
		<button
			type="submit"
			class="mt-2 rounded-md bg-ctp-mauve px-3 py-2 font-medium text-ctp-crust hover:opacity-90"
		>
			Log in
		</button>
	</form>
</div>

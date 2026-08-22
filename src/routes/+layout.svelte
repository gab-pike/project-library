<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	let { children }: { children: Snippet } = $props();

	async function logout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		goto('/login');
	}
</script>

<div class="flex min-h-screen flex-col">
	{#if page.url.pathname !== '/login'}
		<header class="border-b border-ctp-surface0 bg-ctp-mantle">
			<nav class="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
				<a href="/" class="text-lg font-semibold text-ctp-lavender">Project Library</a>
				<a href="/" class="text-sm text-ctp-subtext1 hover:text-ctp-text">Library</a>
				<a href="/ideas" class="text-sm text-ctp-subtext1 hover:text-ctp-text">Ideas</a>
				<a href="/categories" class="text-sm text-ctp-subtext1 hover:text-ctp-text">Categories</a>
				<button onclick={logout} class="ml-auto text-sm text-ctp-subtext1 hover:text-ctp-text">
					Logout
				</button>
			</nav>
		</header>
	{/if}

	<main class="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
		{@render children()}
	</main>
</div>

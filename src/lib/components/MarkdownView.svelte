<script lang="ts">
	import { browser } from '$app/environment';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';

	let { source }: { source: string } = $props();

	// DOMPurify needs a real DOM, so sanitized HTML only renders client-side after hydration.
	// During SSR we show the raw markdown as plain text — never unsanitized HTML.
	const html = $derived(browser ? DOMPurify.sanitize(marked.parse(source, { async: false }) as string) : '');
</script>

{#if browser}
	<div class="markdown-body">{@html html}</div>
{:else}
	<div class="whitespace-pre-wrap text-ctp-subtext1">{source}</div>
{/if}

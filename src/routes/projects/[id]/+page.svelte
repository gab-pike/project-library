<script lang="ts">
	import { enhance } from '$app/forms';
	import MarkdownView from '$lib/components/MarkdownView.svelte';
	import { statusBadgeClass } from '$lib/accent';
	import type { PageProps } from './$types';

	// `form` is typed as a union across all 18 named actions below, most of which return
	// unrelated shapes — narrowing it precisely isn't worth the ceremony, so treat it loosely here.
	let { data, form }: { data: PageProps['data']; form: any } = $props();
	const values = $derived(form?.values ?? data.project);

	const TABS = ['overview', 'tasks', 'dates', 'updates', 'notes', 'links'] as const;
	type Tab = (typeof TABS)[number];
	let activeTab = $state<Tab>('overview');

	let selectedNoteId = $state<string | null>(null);
	const selectedNote = $derived(data.notes.find((n) => n.id === selectedNoteId) ?? data.notes[0]);

	const groupedTasks = $derived.by(() => {
		const groups = new Map<string, typeof data.tasks>();
		for (const task of data.tasks) {
			const key = task.group_name ?? 'Ungrouped';
			if (!groups.has(key)) groups.set(key, []);
			groups.get(key)!.push(task);
		}
		return [...groups.entries()];
	});

	const groupedLinks = $derived.by(() => {
		const groups = new Map<string, typeof data.links>();
		for (const link of data.links) {
			const key = link.group_name ?? 'Ungrouped';
			if (!groups.has(key)) groups.set(key, []);
			groups.get(key)!.push(link);
		}
		return [...groups.entries()];
	});

	const inputClass =
		'rounded-md border border-ctp-surface0 bg-ctp-mantle px-3 py-2 text-ctp-text outline-none focus:border-ctp-mauve';
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

<div class="mb-6 flex gap-1 border-b border-ctp-surface0">
	{#each TABS as tab (tab)}
		<button
			onclick={() => (activeTab = tab)}
			class="border-b-2 px-3 py-2 text-sm capitalize {activeTab === tab
				? 'border-ctp-mauve text-ctp-text'
				: 'border-transparent text-ctp-subtext1 hover:text-ctp-text'}"
		>
			{tab}
		</button>
	{/each}
</div>

{#if activeTab === 'overview'}
	<form method="POST" action="?/update" use:enhance class="flex max-w-xl flex-col gap-4">
		<label class="flex flex-col gap-1">
			<span class="text-sm text-ctp-subtext1">Title</span>
			<input name="title" required value={values.title} class={inputClass} />
			{#if form?.error?.title}<p class="text-sm text-ctp-red">{form.error.title[0]}</p>{/if}
		</label>

		<label class="flex flex-col gap-1">
			<span class="text-sm text-ctp-subtext1">Category</span>
			<select name="category_id" class={inputClass}>
				<option value="">No category</option>
				{#each data.categories as c (c.id)}
					<option value={c.id} selected={values.category_id === c.id}>{c.icon} {c.name}</option>
				{/each}
			</select>
		</label>

		<div class="flex gap-4">
			<label class="flex flex-1 flex-col gap-1">
				<span class="text-sm text-ctp-subtext1">Status</span>
				<select name="status" class={inputClass}>
					{#each ['idea', 'active', 'paused', 'completed', 'archived'] as s (s)}
						<option value={s} selected={values.status === s}>{s}</option>
					{/each}
				</select>
			</label>
			<label class="flex flex-1 flex-col gap-1">
				<span class="text-sm text-ctp-subtext1">Priority</span>
				<select name="priority" class={inputClass}>
					{#each ['high', 'medium', 'low'] as p (p)}
						<option value={p} selected={values.priority === p}>{p}</option>
					{/each}
				</select>
			</label>
		</div>

		<label class="flex flex-col gap-1">
			<span class="text-sm text-ctp-subtext1">Overview</span>
			<textarea name="overview" rows="6" class={inputClass}>{values.overview ?? ''}</textarea>
		</label>
		{#if data.project.overview}
			<MarkdownView source={data.project.overview} />
		{/if}

		<label class="flex flex-col gap-1">
			<span class="text-sm text-ctp-subtext1">Goals</span>
			<textarea name="goals" rows="4" class={inputClass}>{values.goals ?? ''}</textarea>
		</label>
		{#if data.project.goals}
			<MarkdownView source={data.project.goals} />
		{/if}

		<div class="flex items-center gap-3">
			<button type="submit" class="rounded-md bg-ctp-mauve px-4 py-2 font-medium text-ctp-base hover:opacity-90">
				Save
			</button>
			{#if form?.saved}<span class="text-sm text-ctp-green">Saved.</span>{/if}
		</div>
	</form>

	<form method="POST" action="?/archive" use:enhance class="mt-8 border-t border-ctp-surface0 pt-4">
		<button type="submit" class="text-sm text-ctp-red hover:underline">Archive this project</button>
	</form>
{:else if activeTab === 'tasks'}
	<form method="POST" action="?/createTask" use:enhance class="mb-6 flex flex-wrap gap-2">
		<input name="content" required placeholder="Add a task…" class="min-w-48 flex-1 {inputClass}" />
		<input name="group_name" placeholder="Group (optional)" class="w-40 {inputClass}" />
		<input type="date" name="due_date" class={inputClass} />
		<button type="submit" class="rounded-md bg-ctp-mauve px-3 py-2 text-sm font-medium text-ctp-base hover:opacity-90">
			Add
		</button>
	</form>

	{#if data.tasks.length === 0}
		<p class="text-ctp-subtext1">No tasks yet.</p>
	{/if}

	{#each groupedTasks as [groupName, tasks] (groupName)}
		<h3 class="mb-2 mt-4 text-sm font-semibold text-ctp-subtext1 first:mt-0">{groupName}</h3>
		<ul class="flex flex-col gap-2">
			{#each tasks as task (task.id)}
				<li class="flex items-center gap-3 rounded-md border border-ctp-surface0 bg-ctp-mantle px-3 py-2">
					<form method="POST" action="?/setTaskDone" use:enhance>
						<input type="hidden" name="id" value={task.id} />
						<input type="hidden" name="done" value="false" />
						<input
							type="checkbox"
							name="done"
							value="true"
							checked={!!task.done}
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
							class="size-4 accent-ctp-mauve"
						/>
					</form>
					<span class="flex-1 text-ctp-text {task.done ? 'text-ctp-overlay1 line-through' : ''}">
						{task.content}
					</span>
					{#if task.due_date}<span class="text-xs text-ctp-peach">{task.due_date}</span>{/if}
					<form method="POST" action="?/moveTask" use:enhance>
						<input type="hidden" name="id" value={task.id} />
						<input type="hidden" name="direction" value="up" />
						<button type="submit" class="text-ctp-subtext1 hover:text-ctp-text" aria-label="Move up">↑</button>
					</form>
					<form method="POST" action="?/moveTask" use:enhance>
						<input type="hidden" name="id" value={task.id} />
						<input type="hidden" name="direction" value="down" />
						<button type="submit" class="text-ctp-subtext1 hover:text-ctp-text" aria-label="Move down">↓</button>
					</form>
					<form method="POST" action="?/deleteTask" use:enhance>
						<input type="hidden" name="id" value={task.id} />
						<button type="submit" class="text-sm text-ctp-red hover:underline">Delete</button>
					</form>
				</li>
			{/each}
		</ul>
	{/each}
{:else if activeTab === 'dates'}
	<form method="POST" action="?/createDate" use:enhance class="mb-6 flex flex-wrap items-end gap-2">
		<label class="flex flex-col gap-1">
			<span class="text-sm text-ctp-subtext1">Label</span>
			<input name="label" required class={inputClass} />
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-sm text-ctp-subtext1">Date</span>
			<input type="date" name="date" required class={inputClass} />
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-sm text-ctp-subtext1">Kind</span>
			<select name="kind" class={inputClass}>
				{#each ['deadline', 'milestone', 'appointment', 'seasonal', 'other'] as k (k)}
					<option value={k}>{k}</option>
				{/each}
			</select>
		</label>
		<button type="submit" class="rounded-md bg-ctp-mauve px-3 py-2 text-sm font-medium text-ctp-base hover:opacity-90">
			Add
		</button>
	</form>

	{#if data.dates.length === 0}
		<p class="text-ctp-subtext1">No important dates yet.</p>
	{:else}
		<ul class="flex flex-col gap-2">
			{#each data.dates as d (d.id)}
				<li class="flex items-center gap-3 rounded-md border border-ctp-surface0 bg-ctp-mantle px-3 py-2">
					<span class="w-28 shrink-0 text-sm text-ctp-peach">{d.date}</span>
					<span class="flex-1 text-ctp-text">{d.label}</span>
					<span class="text-xs text-ctp-subtext0">{d.kind}</span>
					<form method="POST" action="?/deleteDate" use:enhance>
						<input type="hidden" name="id" value={d.id} />
						<button type="submit" class="text-sm text-ctp-red hover:underline">Delete</button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
{:else if activeTab === 'updates'}
	<form method="POST" action="?/createUpdate" use:enhance class="mb-6 flex flex-col gap-2">
		<textarea name="body" rows="3" required placeholder="What happened?" class={inputClass}></textarea>
		<button
			type="submit"
			class="self-start rounded-md bg-ctp-mauve px-3 py-1.5 text-sm font-medium text-ctp-base hover:opacity-90"
		>
			Post update
		</button>
	</form>

	{#if data.updates.length === 0}
		<p class="text-ctp-subtext1">No updates yet.</p>
	{:else}
		<ul class="flex flex-col gap-4">
			{#each data.updates as u (u.id)}
				<li class="rounded-md border border-ctp-surface0 bg-ctp-mantle p-4">
					<div class="mb-2 flex items-center justify-between">
						<span class="text-xs text-ctp-subtext0">{new Date(u.created_at).toLocaleString()}</span>
						<form method="POST" action="?/deleteUpdate" use:enhance>
							<input type="hidden" name="id" value={u.id} />
							<button type="submit" class="text-xs text-ctp-red hover:underline">Delete</button>
						</form>
					</div>
					<MarkdownView source={u.body} />
				</li>
			{/each}
		</ul>
	{/if}
{:else if activeTab === 'notes'}
	<div class="flex gap-6">
		<div class="w-48 shrink-0">
			<form method="POST" action="?/createNote" use:enhance class="mb-3 flex flex-col gap-2">
				<input name="title" required placeholder="New note title" class="{inputClass} text-sm" />
				<button type="submit" class="rounded-md border border-ctp-surface0 px-2 py-1 text-sm text-ctp-subtext1 hover:text-ctp-text">
					+ Add note
				</button>
			</form>
			<ul class="flex flex-col gap-1">
				{#each data.notes as note (note.id)}
					<li>
						<button
							onclick={() => (selectedNoteId = note.id)}
							class="w-full truncate rounded-md px-2 py-1.5 text-left text-sm {selectedNote?.id === note.id
								? 'bg-ctp-surface0 text-ctp-text'
								: 'text-ctp-subtext1 hover:text-ctp-text'}"
						>
							{note.title}
						</button>
					</li>
				{/each}
			</ul>
		</div>

		{#if selectedNote}
			<div class="flex-1">
				<form method="POST" action="?/updateNote" use:enhance class="flex flex-col gap-3">
					<input type="hidden" name="id" value={selectedNote.id} />
					<input name="title" required value={selectedNote.title} class={inputClass} />
					<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
						<textarea name="body" rows="12" class={inputClass}>{selectedNote.body ?? ''}</textarea>
						<div class="rounded-md border border-ctp-surface0 bg-ctp-mantle p-3">
							<MarkdownView source={selectedNote.body ?? ''} />
						</div>
					</div>
					<div class="flex items-center gap-3">
						<button type="submit" class="rounded-md bg-ctp-mauve px-4 py-2 font-medium text-ctp-base hover:opacity-90">
							Save note
						</button>
					</div>
				</form>
				<form method="POST" action="?/deleteNote" use:enhance class="mt-3">
					<input type="hidden" name="id" value={selectedNote.id} />
					<button type="submit" class="text-sm text-ctp-red hover:underline">Delete this note</button>
				</form>
			</div>
		{:else}
			<p class="text-ctp-subtext1">No notes yet — add one to get started.</p>
		{/if}
	</div>
{:else if activeTab === 'links'}
	<form method="POST" action="?/createLink" use:enhance class="mb-6 flex flex-wrap gap-2">
		<input name="url" required placeholder="https://…" class="min-w-48 flex-1 {inputClass}" />
		<input name="title" placeholder="Title (optional)" class="w-40 {inputClass}" />
		<input name="group_name" placeholder="Group (optional)" class="w-32 {inputClass}" />
		<button type="submit" class="rounded-md bg-ctp-mauve px-3 py-2 text-sm font-medium text-ctp-base hover:opacity-90">
			Add
		</button>
	</form>

	{#if data.links.length === 0}
		<p class="text-ctp-subtext1">No links yet.</p>
	{/if}

	{#each groupedLinks as [groupName, links] (groupName)}
		<h3 class="mb-2 mt-4 text-sm font-semibold text-ctp-subtext1 first:mt-0">{groupName}</h3>
		<ul class="flex flex-col gap-2">
			{#each links as link (link.id)}
				<li class="flex items-center gap-3 rounded-md border border-ctp-surface0 bg-ctp-mantle px-3 py-2">
					<a href={link.url} target="_blank" rel="noreferrer" class="flex-1 truncate text-ctp-mauve hover:underline">
						{link.title || link.url}
					</a>
					<form method="POST" action="?/deleteLink" use:enhance>
						<input type="hidden" name="id" value={link.id} />
						<button type="submit" class="text-sm text-ctp-red hover:underline">Delete</button>
					</form>
				</li>
			{/each}
		</ul>
	{/each}
{/if}

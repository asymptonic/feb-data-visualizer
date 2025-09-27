<script lang="ts">
	import { page } from '$app/state';
	import { useRecord } from '$lib/pocketbase.svelte';
	import type { ProjectsResponse } from '$lib/types/db';
	import { Loader } from 'lucide-svelte';

	let project = useRecord<ProjectsResponse>('projects', page.params.projectid!);
</script>

<section class="border-b px-8 py-5">
	<div class="flex items-center gap-5">
		<img class="my-1 h-8" src="https://cdn.lowk.app/feb.avif" alt="feb logo" />
		<div class="flex gap-1.5">
			<span class="cursor-default text-primary/50">Projects / </span>
			<div>
				{#if !project.record}
					<Loader class="animate-spin" />
				{:else}
					{project.record.name}
				{/if}
			</div>
		</div>
	</div>
</section>

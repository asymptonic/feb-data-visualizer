<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { pb, useList } from '$lib/pocketbase.svelte';
	import type { FilesResponse } from '$lib/types/db';
	import { FileDigit, X } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import FileUpload from './FileUpload.svelte';

	let files = useList<FilesResponse>('files');

	let csv = $state('');
</script>

<ul class="text-neutral-400">
	<FileUpload />

	{#each files.records as file (file.id)}
		<li class="group flex cursor-default items-center gap-2 hover:text-white">
			<FileDigit size={16} />
			{file.name}

			<AlertDialog.Root>
				<AlertDialog.Trigger class="hidden cursor-pointer group-hover:block">
					<X size={20} />
				</AlertDialog.Trigger>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Title>Delete "{file.name}"</AlertDialog.Title>
						<AlertDialog.Description>This action cannot be undone.</AlertDialog.Description>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
						<AlertDialog.Action
							onclick={() =>
								toast.promise(pb.collection('files').delete(file.id), {
									loading: `Deleting "${file.name}"`,
									success: `Deleted "${file.name}"`,
									error: `Deletion failed`
								})}
						>
							Continue
						</AlertDialog.Action>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>
		</li>
	{/each}
</ul>

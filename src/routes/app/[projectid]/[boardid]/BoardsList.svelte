<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { PUBLIC_DEMO_PATH } from '$env/static/public';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { pb, useList } from '$lib/pocketbase.svelte';
	import type { BoardsResponse } from '$lib/types/db';
	import X from '@lucide/svelte/icons/x';
	import { Presentation } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let { projectid }: { projectid: string } = $props();

	let boards = useList<BoardsResponse>('boards');
</script>

<ul class="sticky top-20 flex w-72 flex-col overflow-clip p-5 pl-8">
	{#each boards.records as board (board.id)}
		<li class="group -mx-2 flex w-full cursor-default items-center gap-2 px-2 py-1">
			<Presentation class="shrink-0 group-hover:hidden" size={16} />

			<AlertDialog.Root>
				<AlertDialog.Trigger class="hidden cursor-pointer group-hover:block">
					<X size={16} />
				</AlertDialog.Trigger>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Title>Delete "{board.name}"</AlertDialog.Title>
						<AlertDialog.Description>This action cannot be undone.</AlertDialog.Description>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
						<AlertDialog.Action
							onclick={() => {
								if (board.id === 'f5n30udvp1hlvmt') return toast.error('This board is protected.');
								toast.promise(
									pb
										.collection('boards')
										.delete(board.id)
										.then(async () => await goto(PUBLIC_DEMO_PATH)),
									{
										loading: `Deleting "${board.name}"`,
										success: `Deleted "${board.name}"`,
										error: `Deletion failed`
									}
								);
							}}
						>
							Continue
						</AlertDialog.Action>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>

			<a
				class="text-ellipsis whitespace-nowrap underline-offset-2 hover:underline"
				href={`/app/${page.params.projectid}/${board.id}`}
			>
				{board.name}
			</a>
		</li>
	{/each}
</ul>

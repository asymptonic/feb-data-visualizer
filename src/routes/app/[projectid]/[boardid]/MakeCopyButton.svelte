<script lang="ts">
	import { goto } from '$app/navigation';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { pb } from '$lib/pocketbase.svelte';
	import type { BoardsResponse } from '$lib/types/db';
	import { toast } from 'svelte-sonner';

	let { record }: { record: BoardsResponse } = $props();

	let value = $state(record.name + ' - Copy');
</script>

<Dialog.Root>
	<Dialog.Trigger class={buttonVariants({ variant: 'default' })}>Make Copy</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Make copy of current board</Dialog.Title>
			<Dialog.Description></Dialog.Description>
		</Dialog.Header>

		<div>
			<Label>Name</Label>
			<Input bind:value placeholder="" />
		</div>

		<Dialog.Footer>
			<Dialog.Close
				class={buttonVariants({ variant: 'default' })}
				onclick={async (e) => {
					const { id, name, ...board } = record;
					toast.promise(
						pb
							.collection('boards')
							.create({ name: value, ...board })
							.then(async (newBoard) => {
								await goto(`/app/${newBoard.project}/${newBoard.id}`);
								window.location.reload(); // this was the simplest solution
							}),
						{
							loading: `Copying to ${value}`,
							success: `Copied to ${value}`,
							error: `Copy failed`
						}
					);
					value = record.name + ' - Copy';
				}}
			>
				Confirm
			</Dialog.Close>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

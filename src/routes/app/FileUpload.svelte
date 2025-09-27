<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { pb } from '$lib/pocketbase.svelte';
	import type { FilesRecord } from '$lib/types/db';
	import { toast } from 'svelte-sonner';

	let value = $state('');
	let files: FileList | undefined = $state();
</script>

<Dialog.Root>
	<Dialog.Trigger class={buttonVariants({ variant: 'default' })}>Upload File</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Upload File</Dialog.Title>
			<Dialog.Description></Dialog.Description>
		</Dialog.Header>

		<div>
			<Label>Name</Label>
			<Input bind:value placeholder="Optional" />
		</div>
		<div>
			<Label>File</Label>
			<Input type="file" accept="text/csv" bind:files />
		</div>

		<Dialog.Footer>
			<Dialog.Close
				class={buttonVariants({ variant: 'default' })}
				onclick={async (e) => {
					if (!files) {
						toast.error('No file selected');
						return e.preventDefault();
					}

					toast.promise(
						pb.collection('files').create({
							name: value == '' ? files[0].name : value,
							// @ts-expect-error
							file: files[0],
							path: ''
						} satisfies FilesRecord),
						{
							loading: `Uploading ${files[0].name}`,
							success: `Uploaded ${files[0].name}`,
							error: `Error uploading or file type not allowed.`
						}
					);
				}}
			>
				Upload
			</Dialog.Close>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

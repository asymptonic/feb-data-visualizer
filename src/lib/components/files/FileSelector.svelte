<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { pb, useList } from '$lib/pocketbase.svelte';
	import type { FilesRecord, FilesResponse } from '$lib/types/db';
	import { cn } from '$lib/utils.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { tick } from 'svelte';
	import * as Dialog from '../ui/dialog';
	import { buttonVariants } from '../ui/button';
	import { toast } from 'svelte-sonner';
	import Input from '../ui/input/input.svelte';
	import { Label } from '../ui/label';
	import { Upload } from 'lucide-svelte';
	import X from '@lucide/svelte/icons/x';
	import * as AlertDialog from '../ui/alert-dialog';

	let files = useList<FilesResponse>('files', {});

	let {
		initialValue,
		onchange,
		multiselect = false
	}: {
		initialValue?: string | string[];
		onchange: (selectedids: string[]) => void;
		multiselect?: boolean;
	} = $props();

	$effect(() => {
		if (!initialValue) return;
		if (typeof initialValue == 'string') {
			initialValue = [initialValue];
		}
		const fileRecords = initialValue
			.map((v) => files.records.find((f) => f.id === v))
			.filter((f) => !!f);
		value = fileRecords.map((f) => f.id + f.name);
	});

	let open = $state(false);
	let value = $state<string[]>([]);
	let triggerRef = $state<HTMLButtonElement>(null!);

	let selectedValues = $derived(
		value.map((v) => files.records.find((f) => f.id + f.name === v)).filter((f) => !!f)
	);

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}

	let nameOfFileToUpload = $state('');
	let fileToUpload = $state<FileList>();
</script>

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef}>
		{#snippet child({ props })}
			<Button
				variant="outline"
				class="w-80 justify-between"
				{...props}
				role="combobox"
				aria-expanded={open}
			>
				{selectedValues.map((f) => f.name).join(', ') || 'Select a file'}
				<ChevronsUpDownIcon class="ml-2 size-4 shrink-0 opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="min-w-[200px] p-0">
		<Command.Root>
			<Command.Input placeholder="Search files..." />
			<Command.List>
				<Command.Empty>File not found.</Command.Empty>
				<Command.Group>
					<Dialog.Root>
						<Dialog.Trigger class={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>
							<Upload />
							Upload File
						</Dialog.Trigger>
						<Dialog.Content>
							<Dialog.Header>
								<Dialog.Title>Upload File</Dialog.Title>
							</Dialog.Header>

							<div>
								<Label>Name</Label>
								<Input bind:value={nameOfFileToUpload} placeholder="Optional" />
							</div>
							<div>
								<Label>File</Label>
								<Input type="file" bind:files={fileToUpload} />
							</div>

							<Dialog.Footer>
								<Dialog.Close
									class={buttonVariants({ variant: 'default' })}
									onclick={async (e) => {
										if (!fileToUpload) {
											toast.error('No file selected');
											return e.preventDefault();
										}

										toast.promise(
											pb.collection('files').create({
												name: nameOfFileToUpload == '' ? fileToUpload[0].name : nameOfFileToUpload,
												// @ts-expect-error
												file: fileToUpload[0],
												path: ''
											} satisfies FilesRecord),
											{
												loading: `Uploading ${fileToUpload[0].name}`,
												success: `Uploaded ${fileToUpload[0].name}`,
												error: `Error uploading or file unsupported.`
											}
										);

										nameOfFileToUpload = '';
										fileToUpload = undefined;
									}}
								>
									Upload
								</Dialog.Close>
							</Dialog.Footer>
						</Dialog.Content>
					</Dialog.Root>
				</Command.Group>
				<Command.CommandSeparator />
				<Command.Group>
					{#each files.records as file}
						<Command.Item
							class="group whitespace-nowrap"
							value={file.id + file.name}
							onSelect={async () => {
								if (multiselect) {
									const existingIndex = value.indexOf(file.id + file.name);
									if (existingIndex == -1) {
										value.push(file.id + file.name);
									} else {
										value.splice(existingIndex, 1);
									}
								} else {
									value = [file.id + file.name];
									closeAndFocusTrigger();
								}
								await tick();
								console.log(selectedValues.map((v) => v.id));
								onchange(selectedValues.map((v) => v.id));
							}}
						>
							<CheckIcon
								class={cn(
									'mr-2 size-4',
									!value.includes(file.id + file.name) && 'text-transparent'
								)}
							/>
							{file.name}

							{#if file.file.endsWith('.csv')}
								<div class="font-mono text-primary/60">[CSV]</div>
							{/if}

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
											onclick={() => {
												if (file.id === '7yskuimmr3vmbor' || file.id === 'jxbnty0xu2l05v9')
													return toast.error('This file is protected.');
												toast.promise(
													pb.collection('files').delete(file.id).then(closeAndFocusTrigger),
													{
														loading: `Deleting "${file.name}"`,
														success: `Deleted "${file.name}"`,
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
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>

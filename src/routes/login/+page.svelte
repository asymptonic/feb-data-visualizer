<script lang="ts">
	import { goto } from '$app/navigation';
	import { PUBLIC_DEMO_PATH } from '$env/static/public';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import Label from '$lib/components/ui/label/label.svelte';
	import { pb } from '$lib/pocketbase.svelte';
	import { toast } from 'svelte-sonner';

	let email = $state('');
	let password = $state('');
</script>

<div class="grid h-dvh place-items-center">
	<div>
		<div class="mb-5 flex items-center gap-5 text-lg font-light leading-snug">
			<img class="my-1 h-10" src="https://cdn.lowk.app/feb.avif" alt="feb logo" />
			FORMULA ELECTRIC<br />@ BERKELEY
		</div>
		<div class="flex w-fit flex-col gap-2.5">
			<div class="flex w-full justify-end gap-2.5">
				<Label for="email-input">Email</Label>
				<Input class="w-56" id="email-input" bind:value={email} />
			</div>
			<div class="flex w-full justify-end gap-2.5">
				<Label for="password-input">Pass</Label>
				<Input class="w-56" id="password-input" type="password" bind:value={password} />
			</div>
			<Button
				class="mt-5"
				onclick={() => {
					if (email === '' || password === '') return toast.error('Please fill out all fields.');
					toast.promise(
						pb
							.collection('users')
							.authWithPassword(email, password)
							.then(async () => goto(PUBLIC_DEMO_PATH)),
						{
							loading: `Logging in`,
							success: `Logged in`,
							error: `Login failed`
						}
					);
				}}>Continue to demo</Button
			>
		</div>
	</div>
</div>

<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Toaster } from 'svelte-sonner';
	import { user, userRefresh } from '$lib/pocketbase.svelte';
	import { goto } from '$app/navigation';

	let { children } = $props();

	$effect(() => {
		(async () => {
			await userRefresh();
			if (!user.record?.id) await goto('/login');
		})();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Toaster position="top-right" duration={5000} expand={true} richColors theme="dark" />
{@render children?.()}

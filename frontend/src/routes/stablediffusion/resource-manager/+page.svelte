<script lang="ts">
	import { HttpService } from '$lib/services/HttpService';
	import type { SDCheckpoint } from '$lib/types/SD/SDCheckpoint';
	import type { SDLora } from '$lib/types/SD/SDLora';
	import { onMount } from 'svelte';
	import ResourceList from './components/ResourceList.svelte';

	let currentTab: 'CHECKPOINTS' | 'LORAS' = 'CHECKPOINTS';

	let loras: SDLora[] = [];
	let checkpoints: SDCheckpoint[] = [];

	onMount(() => {
		fetchResources();
	});

	async function fetchResources() {
		const [sdLoras, sdCheckpoints] = await Promise.all([
			HttpService.get<SDLora[]>(`/sd/loras`),
			HttpService.get<SDCheckpoint[]>(`/sd/checkpoints`)
		]);

		loras = sdLoras;
		checkpoints = sdCheckpoints;
	}
</script>

<div class="bg-zinc-900 p-2 rounded-md h-full flex flex-col">
	<div class="flex w-full items-center">
		<button
			class={`${currentTab === 'CHECKPOINTS' ? ' border-red-950 ' : 'border-zinc-950 hover:text-red-800 hover:border-red-800 hover:transition'} border-b-2 pb-2 flex-[0.3]`}
			on:click={() => (currentTab = 'CHECKPOINTS')}>Checkpoints</button
		>
		<button
			class={`${currentTab === 'LORAS' ? ' border-red-950 ' : 'border-zinc-950 hover:text-red-800 hover:border-red-800 hover:transition'} border-b-2 pb-2 flex-[0.3]`}
			on:click={() => (currentTab = 'LORAS')}>Loras</button
		>
		<div class="border-b-2 border-zinc-950 flex-1 h-full"></div>
	</div>

	<div>
		{#if currentTab === 'CHECKPOINTS'}
			<ResourceList resources={checkpoints} />
		{/if}
		{#if currentTab === 'LORAS'}
			<ResourceList resources={loras} />
		{/if}
	</div>
</div>

<svelte:head>
	<title>NoriBooru - SD Resources</title>
</svelte:head>

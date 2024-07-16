<script lang="ts">
	import { HttpService } from '$lib/services/HttpService';
	import type { PopulatedTag } from '$lib/types/PopulatedTag';
	import type { SDCheckpoint } from '$lib/types/SD/SDCheckpoint';
	import type { SDLora } from '$lib/types/SD/SDLora';
	import { onMount } from 'svelte';
	import CheckpointEdit from './components/CheckpointEdit.svelte';
	import LoraEdit from './components/LoraEdit.svelte';
	import ResourceList from './components/ResourceList.svelte';

	let currentTab: 'CHECKPOINTS' | 'LORAS' = 'CHECKPOINTS';

	let loras: SDLora[] = [];
	let checkpoints: SDCheckpoint[] = [];
	let tags: PopulatedTag[] = [];
	let isEditWindowOpen = false;
	let currentlySelectedResource:
		| (SDLora & { type: string })
		| (SDCheckpoint & { type: string })
		| undefined;

	function onCheckpointClick(sdCheckpoint: SDCheckpoint): void {
		currentlySelectedResource = { ...sdCheckpoint, type: 'checkpoint' };
		isEditWindowOpen = true;
	}

	function onLoraClick(sdLora: SDLora): void {
		currentlySelectedResource = { ...sdLora, type: 'lora' };
		isEditWindowOpen = true;
	}

	onMount(() => {
		fetchResources();
	});

	async function fetchResources() {
		const [sdLoras, sdCheckpoints, fetchedTags] = await Promise.all([
			HttpService.get<SDLora[]>(`/sd/loras`),
			HttpService.get<SDCheckpoint[]>(`/sd/checkpoints`),
			HttpService.get<PopulatedTag[]>(`/tags`)
		]);

		loras = sdLoras;
		checkpoints = sdCheckpoints;
		tags = fetchedTags;
	}

	function closeEditWindow() {
		isEditWindowOpen = false;
		currentlySelectedResource = undefined;
	}
</script>

<div class="bg-zinc-900 p-2 rounded-md h-full flex flex-col">
	<div class="flex w-full items-center">
		<button
			class={`${currentTab === 'CHECKPOINTS' ? ' border-red-950 ' : 'border-zinc-950 hover:text-red-800 hover:border-red-800 hover:transition'} border-b-2 pb-2 flex-[0.3]`}
			on:click={() => {
				currentTab = 'CHECKPOINTS';
				closeEditWindow();
			}}>Checkpoints</button
		>
		<button
			class={`${currentTab === 'LORAS' ? ' border-red-950 ' : 'border-zinc-950 hover:text-red-800 hover:border-red-800 hover:transition'} border-b-2 pb-2 flex-[0.3]`}
			on:click={() => {
				currentTab = 'LORAS';
				closeEditWindow();
			}}>Loras</button
		>
		<div class="border-b-2 border-zinc-950 flex-1 h-full"></div>
	</div>

	<div class="flex justify-between h-full">
		{#if currentTab === 'CHECKPOINTS'}
			<div class="mt-2 flex-[0.7]">
				<ResourceList
					onResourceClick={onCheckpointClick}
					resources={checkpoints}
					selectedResourceId={currentlySelectedResource?.id}
				/>
			</div>
		{/if}
		{#if currentTab === 'LORAS'}
			<div class="mt-2 flex-[0.7]">
				<!-- <TagSearchInput  /> -->
				<ResourceList
					onResourceClick={onLoraClick}
					resources={loras}
					selectedResourceId={currentlySelectedResource?.id}
				/>
			</div>
		{/if}
		{#if isEditWindowOpen && currentlySelectedResource}
			<div class="border-l-2 border-red-950 h-full pl-4 pr-4 pt-4 flex-[0.3]">
				{#if currentlySelectedResource.type === 'checkpoint'}
					<CheckpointEdit
						bind:checkpoint={currentlySelectedResource as SDCheckpoint}
						bind:isOpen={isEditWindowOpen}
					/>
				{/if}
				{#if currentlySelectedResource.type === 'lora'}
					<LoraEdit
						bind:isOpen={isEditWindowOpen}
						bind:tags
						bind:sdLora={currentlySelectedResource as SDLora}
					/>
				{/if}
			</div>
		{/if}
	</div>
</div>

<svelte:head>
	<title>NoriBooru - SD Resources</title>
</svelte:head>

<script lang="ts">
	import Button from '$lib/Button.svelte';
	import LoadingBackground from '$lib/components/LoadingBackground.svelte';
	import { createToast } from '$lib/components/toast/ToastContainer.svelte';
	import Modal from '$lib/Modal.svelte';
	import { HttpService } from '$lib/services/HttpService';
	import TagSearchInput from '$lib/TagSearchInput.svelte';
	import type { PopulatedTag } from '$lib/types/PopulatedTag';
	import type { SDCheckpoint } from '$lib/types/SD/SDCheckpoint';
	import type { SDLora } from '$lib/types/SD/SDLora';
	import { onMount } from 'svelte';
	import { vaultStore } from '../../../store';
	import LabeledComponent from '../../components/LabeledComponent.svelte';
	import TextInput from '../../components/TextInput.svelte';
	import CheckpointEdit from './components/CheckpointEdit.svelte';
	import LoraEdit from './components/LoraEdit.svelte';
	import RegisterApiKey from './components/RegisterApiKey.svelte';
	import ResourceList from './components/ResourceList.svelte';

	let currentTab: 'CHECKPOINTS' | 'LORAS' = 'CHECKPOINTS';

	// Delete Modal
	let isDeleteModalOpen = false;
	let deletionResource: { id: string; name: string } | undefined;
	let deletionResourceType = '';
	let isModalLoading = false;

	let loras: SDLora[] = [];
	let checkpoints: SDCheckpoint[] = [];
	let tags: PopulatedTag[] = [];
	let isEditWindowOpen = false;
	let currentlySelectedResource:
		| (SDLora & { type: string })
		| (SDCheckpoint & { type: string })
		| undefined;

	// Query
	let queryLoraName: string;
	let loraFilterTags: PopulatedTag[] = [];
	let loraNameInputTimeout: NodeJS.Timeout | undefined;
	let checkpointNameInputTimeout: NodeJS.Timeout | undefined;
	let queryCheckpointName: string;

	// Civitai importing
	let isCivitaiModalOpen = false;
	let isDownloadingModel = false;
	let civitaiModelLink: string;

	async function downloadCivitaiResource() {
		isDownloadingModel = true;
		try {
			await HttpService.post(`/sd/civitai/download-resource`, { url: civitaiModelLink });
			await fetchResources();
			createToast('Model added successfully!');
		} catch {
		} finally {
			isDownloadingModel = false;
			isCivitaiModalOpen = false;
		}
	}

	function onCheckpointClick(sdCheckpoint: SDCheckpoint): void {
		currentlySelectedResource = { ...sdCheckpoint, type: 'checkpoint' };
		isEditWindowOpen = true;
	}

	function onLoraClick(sdLora: SDLora): void {
		currentlySelectedResource = { ...sdLora, type: 'lora' };
		isEditWindowOpen = true;
	}

	function openDeleteModal(resourceId: string, resourceName: string, type: 'LORA' | 'CHECKPOINT') {
		isDeleteModalOpen = true;
		deletionResource = { id: resourceId, name: resourceName };
		deletionResourceType = type;
	}

	async function deleteResource() {
		isModalLoading = true;

		try {
			await HttpService.delete(
				`/sd/${deletionResourceType === 'LORA' ? 'loras' : 'checkpoints'}/${deletionResource?.id}`
			);

			if (deletionResourceType === 'LORA') {
				const index = loras.findIndex((lora) => lora.id === deletionResource?.id);
				loras.splice(index, 1);
				loras = loras;
			} else {
				const index = checkpoints.findIndex((checkpoint) => checkpoint.id === deletionResource?.id);
				checkpoints.splice(index, 1);
				checkpoints = checkpoints;
			}

			createToast(`${deletionResource?.name} deleted successfully!`);
		} catch {
			createToast(`There was an error while deleting ${deletionResource?.name}`);
		} finally {
			isDeleteModalOpen = false;
			deletionResource = undefined;
			deletionResourceType = '';
			isModalLoading = false;
		}
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

	// Querying
	async function searchLoras() {
		const filteredLoras = await HttpService.get<SDLora[]>(
			`/sd/loras?tags=${loraFilterTags.map((tag) => tag.id).join(',')}${queryLoraName ? `&name=${queryLoraName}` : ''}`
		);
		loras = filteredLoras;
	}

	async function searchCheckpoints() {
		const filteredCheckpoints = await HttpService.get<SDCheckpoint[]>(
			`/sd/checkpoints${queryCheckpointName ? `?name=${queryCheckpointName}` : ''}`
		);
		checkpoints = filteredCheckpoints;
	}

	function addTagToFilter(tag: PopulatedTag) {
		loraFilterTags.push(tag);
		loraFilterTags = loraFilterTags;
	}

	function removeTagFromFilter(tag: PopulatedTag) {
		const index = loraFilterTags.findIndex((t) => t.id === tag.id);
		if (index !== -1) {
			loraFilterTags.splice(index, 1);
		}
		loraFilterTags = loraFilterTags;
	}

	async function startOnLoraInputTimeout() {
		if (loraNameInputTimeout) {
			clearTimeout(loraNameInputTimeout);
		}

		loraNameInputTimeout = setTimeout(() => {
			searchLoras();
		}, 750);
	}

	async function startOnCheckpointInputTimeout() {
		if (checkpointNameInputTimeout) {
			clearTimeout(checkpointNameInputTimeout);
		}

		checkpointNameInputTimeout = setTimeout(() => {
			searchCheckpoints();
		}, 750);
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
		<div class="border-b-2 border-zinc-950 flex-1 flex justify-end h-full">
			<Button onClick={() => (isCivitaiModalOpen = true)} class="mb-2">Civitai Import</Button>
		</div>
	</div>

	<div class="flex justify-between h-full">
		{#if currentTab === 'CHECKPOINTS'}
			<div class="mt-2 flex-[0.7]">
				<div class="flex">
					<LabeledComponent>
						<div slot="label">Search by name</div>
						<TextInput
							bind:value={queryCheckpointName}
							on:input={startOnCheckpointInputTimeout}
							placeholder="name"
							slot="content"
						/>
					</LabeledComponent>
				</div>
				<ResourceList
					onResourceClick={onCheckpointClick}
					resources={checkpoints}
					selectedResourceId={currentlySelectedResource?.id}
					onResourceDeleteClick={(id, name) => openDeleteModal(id, name, 'CHECKPOINT')}
				/>
			</div>
		{/if}
		{#if currentTab === 'LORAS'}
			<div class="mt-2 flex-[0.7]">
				<div class="flex gap-4">
					<LabeledComponent>
						<div slot="label">Search by name</div>
						<TextInput
							bind:value={queryLoraName}
							on:input={startOnLoraInputTimeout}
							placeholder="name"
							slot="content"
						/>
					</LabeledComponent>
					<LabeledComponent>
						<div slot="label">Query tags</div>
						<TagSearchInput
							availableTags={tags}
							appliedTags={loraFilterTags}
							ignoredTags={loraFilterTags}
							onAppliedTagClick={(tag) => {
								removeTagFromFilter(tag);
								searchLoras();
							}}
							onTagSearchSubmit={(tag) => {
								addTagToFilter(tag);
								searchLoras();
							}}
							slot="content"
						/>
					</LabeledComponent>
				</div>

				<ResourceList
					onResourceClick={onLoraClick}
					resources={loras}
					selectedResourceId={currentlySelectedResource?.id}
					onResourceDeleteClick={(id, name) => openDeleteModal(id, name, 'LORA')}
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
<Modal class="min-h-0" bind:showModal={isDeleteModalOpen}>
	{#if isModalLoading}
		<LoadingBackground />
	{/if}
	<div class="p-4 w-full flex flex-col">
		<div class="text-xl">Are you sure you want to delete</div>
		<div class="font-bold text-xl self-center pt-4 pb-4">{deletionResource?.name}</div>
		<div class="flex flex-1 w-full gap-2">
			<Button class="flex flex-1 w-full h-[40px]" onClick={deleteResource}>Yes</Button>
			<Button class="flex flex-1 w-full h-[40px]" onClick={() => (isDeleteModalOpen = false)}
				>No</Button
			>
		</div>
	</div>
</Modal>

<Modal bind:showModal={isCivitaiModalOpen} class="min-h-0">
	{#if $vaultStore?.civitaiApiKey}
		<div class="flex flex-col w-full gap-4 relative">
			{#if isDownloadingModel}
				<LoadingBackground />
			{/if}
			<div>Enter civitai model link</div>
			<TextInput bind:value={civitaiModelLink} />
			NOTE: use for small files for now
			<Button onClick={downloadCivitaiResource} class={'h-[40px]'}>Submit</Button>
		</div>
	{:else}
		<RegisterApiKey />
	{/if}
</Modal>

<svelte:head>
	<title>NoriBooru - SD Resources</title>
</svelte:head>

<script lang="ts">
	import Button from '$lib/Button.svelte';
	import LoadingBackground from '$lib/components/LoadingBackground.svelte';
	import Select from '$lib/components/Select.svelte';
	import TextArea from '$lib/components/TextArea.svelte';
	import { createToast } from '$lib/components/toast/ToastContainer.svelte';
	import ArrowLeft from '$lib/icons/ArrowLeft.svelte';
	import { HttpService } from '$lib/services/HttpService';
	import TagSearchInput from '$lib/TagSearchInput.svelte';
	import type { PopulatedTag } from '$lib/types/PopulatedTag';
	import type { SDLora } from '$lib/types/SD/SDLora';
	import LabeledComponent from '../../../components/LabeledComponent.svelte';
	import TextInput from '../../../components/TextInput.svelte';

	export let sdLora: SDLora;
	export let isOpen: boolean;
	export let tags: PopulatedTag[];

	let loraName: string;
	let loraDescription: string;
	let loraOrigin: string;
	let sdVersion: string;
	let isLoading = false;

	async function addTagToLora(tag: PopulatedTag) {
		sdLora.tags = sdLora.tags.concat(tag);
		await HttpService.put(`/sd/loras/${sdLora.id}`, {
			tags: sdLora.tags.map((t) => t.id)
		});
	}

	async function removeTagFromLora(tag: PopulatedTag) {
		const index = sdLora.tags.findIndex((t) => t.id === tag.id);
		sdLora.tags.splice(index, 1);
		sdLora.tags = sdLora.tags;
		await HttpService.put(`/sd/loras/${sdLora.id}`, {
			tags: sdLora.tags.map((t) => t.id)
		});
	}

	async function updateLora() {
		isLoading = true;

		try {
			await HttpService.put(`/sd/loras/${sdLora.id}`, {
				name: loraName,
				description: loraDescription,
				origin: loraOrigin,
				sdVersion
			});
			sdLora.name = loraName;
			sdLora.description = loraDescription;
			sdLora.origin = loraOrigin;
			sdLora.sdVersion = sdVersion;
			createToast('Lora updated successfully!');
		} catch (error) {
		} finally {
			isLoading = false;
		}
	}

	$: {
		loraName = sdLora.name;
		loraDescription = sdLora.description;
		sdVersion = sdLora.sdVersion;
		loraOrigin = sdLora.origin;
	}
</script>

<div class="flex flex-col relative">
	{#if isLoading}
		<LoadingBackground />
	{/if}
	<div class="flex gap-4">
		<button on:click={() => (isOpen = false)}><ArrowLeft class="fill-white" /></button>
		<div class="text-xl">Edit Lora</div>
	</div>
	<LabeledComponent>
		<div slot="label">Name</div>
		<TextInput slot="content" bind:value={loraName} />
	</LabeledComponent>
	<LabeledComponent>
		<div slot="label">Description</div>
		<TextArea slot="content" bind:value={loraDescription} />
	</LabeledComponent>
	<LabeledComponent>
		<div slot="label">Path</div>
		<TextInput slot="content" disabled bind:value={sdLora.path} />
	</LabeledComponent>
	<LabeledComponent>
		<div slot="label">Origin</div>
		<div slot="content">
			{#if sdLora.origin.startsWith('http')}
				<a href={sdLora.origin}>{sdLora.origin}</a>
			{:else}
				<TextInput disabled bind:value={sdLora.origin} />
			{/if}
		</div>
	</LabeledComponent>
	<LabeledComponent>
		<div slot="label">SD Version</div>
		<Select class="w-full h-[40px]" slot="content" bind:value={sdVersion}>
			<option>SD 1.5</option>
			<option>SDXL</option>
			<option>Pony</option>
		</Select>
	</LabeledComponent>
	<LabeledComponent>
		<div slot="label">Tags</div>
		<div slot="content">
			<TagSearchInput
				onTagSearchSubmit={(tag) => addTagToLora(tag)}
				onAppliedTagClick={(tag) => removeTagFromLora(tag)}
				availableTags={tags}
				ignoredTags={sdLora.tags}
				appliedTags={sdLora.tags}
			/>
		</div>
	</LabeledComponent>

	<Button onClick={updateLora} class="h-[40px] mt-4">Update</Button>
</div>

<script lang="ts">
	import TagSearchInput from '$lib/components/TagSearchInput.svelte';
	import { endpoints } from '$lib/endpoints';
	import { HttpService } from '$lib/services/HttpService';
	import type { PopulatedTag } from '$lib/types/PopulatedTag';
	import type { RawSDLora } from '$lib/types/SD/SDLora';
	import {
		ArrowLeft,
		Button,
		createToast,
		LabeledComponent,
		LoadingBackground,
		Select,
		TextArea,
		TextInput
	} from '@lendruk/personal-svelte-ui-lib';

	export let sdLora: RawSDLora;
	export let isOpen: boolean;
	export let tags: PopulatedTag[];

	let loraName: string;
	let loraDescription: string;
	let loraOrigin: string;
	let sdVersion: string;
	let isLoading = false;

	async function addTagToLora(tag: PopulatedTag) {
		sdLora.tags = sdLora.tags.concat(tag);
		await HttpService.put(endpoints.sdLora({ id: sdLora.id }), {
			tags: sdLora.tags.map((t) => t.id)
		});
	}

	async function removeTagFromLora(tag: PopulatedTag) {
		const index = sdLora.tags.findIndex((t) => t.id === tag.id);
		sdLora.tags.splice(index, 1);
		sdLora.tags = sdLora.tags;
		await HttpService.put(endpoints.sdLora({ id: sdLora.id }), {
			tags: sdLora.tags.map((t) => t.id)
		});
	}

	async function updateLora() {
		isLoading = true;

		try {
			await HttpService.put(endpoints.sdLora({ id: sdLora.id }), {
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
			<option>SDXL</option>
			<option>Pony</option>
			<option>Illustrious</option>
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
	{#if sdLora.activationWords.length > 0}
		<LabeledComponent>
			<div slot="label">Activation Words</div>
			<div slot="content">
				{#each sdLora.activationWords as word}
					{word},
				{/each}
			</div>
		</LabeledComponent>
	{/if}

	<Button onClick={updateLora} class="h-[40px] mt-4">Update</Button>
</div>

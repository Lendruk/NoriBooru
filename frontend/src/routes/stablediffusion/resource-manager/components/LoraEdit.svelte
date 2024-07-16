<script lang="ts">
	import Button from '$lib/Button.svelte';
	import Select from '$lib/components/Select.svelte';
	import TextArea from '$lib/components/TextArea.svelte';
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
	let sdVersion: string;

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

	$: {
		loraName = sdLora.name;
		loraDescription = sdLora.description;
	}
</script>

<div class="flex flex-col">
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
		<div slot="label">SD Version</div>
		<Select class="w-full h-[40px]" slot="content" bind:value={sdVersion}>
			<option>SD 1.5</option>
			<option>SDXL</option>
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

	<Button class="h-[40px] mt-4">Update</Button>
</div>

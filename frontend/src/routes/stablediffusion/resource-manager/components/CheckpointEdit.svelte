<script lang="ts">
	import Button from '$lib/Button.svelte';
	import Select from '$lib/components/Select.svelte';
	import TextArea from '$lib/components/TextArea.svelte';
	import ArrowLeft from '$lib/icons/ArrowLeft.svelte';
	import type { SDCheckpoint } from '$lib/types/SD/SDCheckpoint';
	import LabeledComponent from '../../../components/LabeledComponent.svelte';
	import TextInput from '../../../components/TextInput.svelte';

	export let checkpoint: SDCheckpoint;
	export let isOpen: boolean;

	let checkpointName: string;
	let checkpointDescription: string;
	let sdVersion: string;

	$: {
		checkpointName = checkpoint.name;
		checkpointDescription = checkpoint.description;
		sdVersion = checkpoint.sdVersion;
	}
</script>

<div class="flex flex-col">
	<div class="flex gap-4">
		<button on:click={() => (isOpen = false)}><ArrowLeft class="fill-white" /></button>
		<div class="text-xl">Edit Checkpoint</div>
	</div>
	<LabeledComponent>
		<div slot="label">Name</div>
		<TextInput slot="content" bind:value={checkpointName} />
	</LabeledComponent>
	<LabeledComponent>
		<div slot="label">Description</div>
		<TextArea slot="content" bind:value={checkpointDescription} />
	</LabeledComponent>
	<LabeledComponent>
		<div slot="label">Path</div>
		<TextInput slot="content" disabled bind:value={checkpoint.path} />
	</LabeledComponent>
	<LabeledComponent>
		<div slot="label">SD Version</div>
		<Select class="w-full h-[40px]" slot="content" bind:value={sdVersion}>
			<option>SD 1.5</option>
			<option>SDXL</option>
		</Select>
	</LabeledComponent>

	<Button class="h-[40px] mt-4">Update</Button>
</div>
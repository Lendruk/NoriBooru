<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import LabeledComponent from '$lib/components/LabeledComponent.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import Select from '$lib/components/Select.svelte';
	import TextArea from '$lib/components/TextArea.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { createToast } from '$lib/components/toast/ToastContainer.svelte';
	import ArrowLeft from '$lib/icons/ArrowLeft.svelte';
	import { HttpService } from '$lib/services/HttpService';
	import type { SDCheckpoint } from '$lib/types/SD/SDCheckpoint';

	export let checkpoint: SDCheckpoint;
	export let isOpen: boolean;

	let isLoading = false;
	let checkpointName: string;
	let checkpointOrigin: string;
	let checkpointDescription: string;
	let sdVersion: string;

	async function updateCheckpoint() {
		isLoading = true;
		try {
			await HttpService.put(`/sd/checkpoints/${checkpoint.id}`, {
				name: checkpointName,
				description: checkpointDescription,
				origin: checkpointOrigin,
				sdVersion
			});
			checkpoint.name = checkpointName;
			checkpoint.description = checkpointDescription;
			checkpoint.origin = checkpointOrigin;
			checkpoint.sdVersion = sdVersion;
			createToast('Checkpoint updated successfully!');
		} catch (error) {
		} finally {
			isLoading = false;
		}
	}

	$: {
		checkpointName = checkpoint.name;
		checkpointDescription = checkpoint.description;
		sdVersion = checkpoint.sdVersion;
		checkpointOrigin = checkpoint.origin;
	}
</script>

<div class="flex flex-col relative">
	{#if isLoading}
		<div
			class="absolute top-0 w-full h-full backdrop-blur-md flex items-center justify-center rounded-sm z-10"
		>
			<LoadingSpinner />
		</div>
	{/if}
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
		<div slot="label">Origin</div>
		<TextInput slot="content" bind:value={checkpointOrigin} />
	</LabeledComponent>
	<LabeledComponent>
		<div slot="label">SD Version</div>
		<Select class="w-full h-[40px]" slot="content" bind:value={sdVersion}>
			<option>SD 1.5</option>
			<option>SDXL</option>
			<option>Pony</option>
		</Select>
	</LabeledComponent>

	<Button onClick={updateCheckpoint} class="h-[40px] mt-4">Update</Button>
</div>

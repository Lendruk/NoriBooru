<script lang="ts">
	import Button from '$lib/Button.svelte';
	import Select from '$lib/components/Select.svelte';
	import DiceEmoji from '$lib/icons/DiceEmoji.svelte';
	import RefreshIcon from '$lib/icons/RefreshIcon.svelte';
	import { HttpService } from '$lib/services/HttpService';
	import type { SDCheckpoint } from '$lib/types/SD/SDCheckpoint';
	import type { SDSampler } from '$lib/types/SD/SDSampler';
	import LabeledComponent from '../../../components/LabeledComponent.svelte';
	import GalleryItemButton from '../../../gallery/GalleryItemButton.svelte';
	import RefinerSelection from '../components/RefinerSelection.svelte';

	export { cssClass as class };
	let cssClass = '';

	export let width: number;
	export let height: number;
	export let seed: number;

	export let samplers: SDSampler[];
	export let checkpoints: SDCheckpoint[];
	export let selectedSampler: string;
	export let selectedCheckpoint: string;
	export let samplingSteps: number;
	export let cfgScale: number;

	export let isRefinerEnabled: boolean;
	export let refinerCheckpint: string;
	export let refinerSwitchAt: number;

	export let numberOfGenerations: number;
	export let imagesPerGeneration: number;

	async function refreshCheckpoints() {
		await HttpService.post(`/sd/refresh-checkpoints`);
		checkpoints = await HttpService.get(`/sd/checkpoints`);
	}

	let sizePresets: [number, number][] = [
		[512, 512],
		[1024, 1024],
		[1344, 768],
		[768, 1344],
		[1280, 768],
		[768, 1280],
		[2048, 2048]
	];

	let aspectRatio = 0;
	$: {
		aspectRatio = width / height;
	}
</script>

<div class={cssClass}>
	<div class="text-xl">General settings</div>

	<div class="flex flex-col flex-1">
		<div class="flex gap-2">
			<LabeledComponent class="flex-1">
				<div slot="label" class="flex justify-between items-center">
					<div>Checkpoint</div>
					<GalleryItemButton width={16} height={16} onClick={refreshCheckpoints}>
						<RefreshIcon />
					</GalleryItemButton>
				</div>
				<div class="w-full" slot="content">
					<Select class="h-[40px] w-full" bind:value={selectedCheckpoint}>
						{#each checkpoints as checkpoint}
							<option value={checkpoint.model_name}>{checkpoint.model_name}</option>
						{/each}
					</Select>
				</div>
			</LabeledComponent>
			<LabeledComponent class="flex-1">
				<div slot="label">Sampling method</div>
				<div class="w-full" slot="content">
					<Select class="h-[40px] w-full" bind:value={selectedSampler}>
						{#each samplers as sampler}
							<option value={sampler.name}>{sampler.name}</option>
						{/each}
					</Select>
				</div>
			</LabeledComponent>
		</div>
		<div>Steps</div>
		<input bind:value={samplingSteps} type="number" />
		<div>Seed</div>
		<div class="flex gap-2">
			<input class="w-full" bind:value={seed} type="number" /><Button onClick={() => (seed = -1)}
				><DiceEmoji /></Button
			>
		</div>
		<div class="flex flex-col flex-1">
			<div>Size</div>
			<div class="flex flex-1 gap-4">
				<div class="flex flex-1 flex-col">
					<div class="flex flex-col flex-1">
						<div>Width</div>
						<input bind:value={width} type="number" />
					</div>
					<div class="flex flex-col flex-1">
						<div>Height</div>
						<input bind:value={height} type="number" />
					</div>
				</div>
				<div class="flex flex-col">
					<div>Preview</div>
					<div class="flex items-center">
						<div class="bg-red-950" style={`width:${64}px; height:${64 / aspectRatio}px`}></div>
					</div>
				</div>
				<div class="flex flex-col flex-1">
					Presets
					<div class="flex gap-2 flex-wrap">
						{#each sizePresets as preset}
							<Button
								onClick={() => {
									width = preset[0];
									height = preset[1];
								}}
							>
								{`${preset[0]}x${preset[1]}`}
							</Button>
						{/each}
					</div>
				</div>
			</div>
		</div>
		<div>
			<div>Cfg Scale ({cfgScale})</div>
			<input bind:value={cfgScale} type="range" min={1} max={14} />
		</div>
		{#if checkpoints.length > 1}
			<div>
				<RefinerSelection
					bind:checkpoints
					bind:currentRefinerCheckpoint={refinerCheckpint}
					bind:currentCheckpoint={selectedCheckpoint}
					bind:refinerSwitchAt
					bind:isRefinerEnabled
				/>
			</div>
		{/if}
		<LabeledComponent>
			<div slot="label">Batching</div>
			<div slot="content">
				<LabeledComponent>
					<div slot="label">Iterations ({numberOfGenerations})</div>
					<input
						slot="content"
						type="range"
						bind:value={numberOfGenerations}
						step={1}
						min={1}
						max={100}
					/>
				</LabeledComponent>
				<LabeledComponent>
					<div slot="label">Images per Iteration ({imagesPerGeneration})</div>
					<input
						slot="content"
						type="range"
						bind:value={imagesPerGeneration}
						step={1}
						min={1}
						max={8}
					/>
				</LabeledComponent>
			</div>
		</LabeledComponent>
	</div>
</div>

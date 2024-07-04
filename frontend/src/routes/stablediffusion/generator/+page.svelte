<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import { page } from '$app/stores';
	import loadingSpinner from '$lib/assets/tail-spin.svg';
	import Button from '$lib/Button.svelte';
	import TextArea from '$lib/components/TextArea.svelte';
	import { createToast } from '$lib/components/toast/ToastContainer.svelte';
	import ChevronDown from '$lib/icons/ChevronDown.svelte';
	import ChevronUp from '$lib/icons/ChevronUp.svelte';
	import SaveIcon from '$lib/icons/SaveIcon.svelte';
	import SearchIcon from '$lib/icons/SearchIcon.svelte';
	import { HttpService } from '$lib/services/HttpService';
	import Tooltip from '$lib/Tooltip.svelte';
	import type { PopulatedTag } from '$lib/types/PopulatedTag';
	import type { SavedPrompt } from '$lib/types/SavedPrompt';
	import type { SDCheckpoint } from '$lib/types/SD/SDCheckpoint';
	import type { SDLora } from '$lib/types/SD/SDLora';
	import type { SDSampler } from '$lib/types/SD/SDSampler';
	import type { SDScheduler } from '$lib/types/SD/SDSchedulers';
	import type { SDUpscaler } from '$lib/types/SD/SDUpscaler';
	import type { SDWildcard } from '$lib/types/SD/SDWildcard';
	import type { Vault } from '$lib/types/Vault';
	import { SDPromptBuilder } from '$lib/utils/SDPromptBuilder';
	import { onMount } from 'svelte';
	import { vaultStore } from '../../../store';
	import PreviewImage from './components/PreviewImage.svelte';
	import PromptSaveModal from './components/PromptSaveModal.svelte';
	import PromptSearch from './components/PromptSearch.svelte';
	import GeneralSettings from './views/GeneralSettings.svelte';
	import HighResSettings from './views/HighResSettings.svelte';
	import LoraSelector from './views/LoraSelector.svelte';
	import WildcardManager from './views/WildcardManager.svelte';

	let checkpoints: SDCheckpoint[] = [];
	let samplers: SDSampler[] = [];
	let schedulers: SDScheduler[] = [];
	let upscalers: SDUpscaler[] = [];
	let loras: SDLora[] = [];
	let wildcards: SDWildcard[] = [];
	let allTags: PopulatedTag[] = [];

	let generatedImage: { fileName: string; id: number } | undefined = undefined;

	let selectedTab: 'GENERAL' | 'HIGHRES' | 'LORAS' | 'WILDCARDS' = 'GENERAL';
	let isGeneratingImage = false;
	let isSearchingPrompts = false;
	let isSavingPrompt = false;
	let areSaveOptionsExpanded = false;

	// General settings
	let promptId: string = '';
	let promptName: string = '';
	let positivePrompt: string = '';
	let negativePrompt: string = '';
	let checkpoint: string;
	let width = 512;
	let height = 512;
	let sampler = '';
	let steps = 20;
	let seed = -1;
	let cfgScale = 7;

	// High res
	let isHighResEnabled = false;
	let upscaleBy = 2;
	let highResUpscaler = '';
	let highResSteps = 0;
	let highResDenoisingStrength = 0.7;

	// Refiner
	let isRefinerEnabled = false;
	let refinerCheckpoint = '';
	let refinerSwitchAt = 0.8;

	let lastGenExif: Record<string, any> | undefined;

	async function setup(vault: Vault) {
		if (!vault.hasInstalledSD) return;

		await HttpService.post(`/sd/start`);
		const [
			fetchedSamplers,
			fetchedCheckpoints,
			fetchedSchedulers,
			fetchedUpscalers,
			fetchedLoras,
			fetchedTags,
			fetchedWildcards
		] = await Promise.all([
			HttpService.get<SDSampler[]>(`/sd/samplers`),
			HttpService.get<SDCheckpoint[]>(`/sd/checkpoints`),
			HttpService.get<SDScheduler[]>(`/sd/schedulers`),
			HttpService.get<SDUpscaler[]>(`/sd/highres/upscalers`),
			HttpService.get<SDLora[]>(`/sd/loras`),
			HttpService.get<PopulatedTag[]>('/tags'),
			HttpService.get<SDWildcard[]>('/sd/wildcards')
		]);

		allTags = fetchedTags;
		samplers = fetchedSamplers;
		checkpoints = fetchedCheckpoints;
		schedulers = fetchedSchedulers;
		upscalers = fetchedUpscalers;
		loras = fetchedLoras;
		wildcards = fetchedWildcards;

		checkpoint = checkpoints[0].model_name;
		sampler = samplers[0].name;
		highResUpscaler = upscalers[0].name;
		if (checkpoints.length > 1) {
			refinerCheckpoint = checkpoints[1].model_name;
		}

		if ($page.url.searchParams.has('inputExif')) {
			const rawExif = $page.url.searchParams.get('inputExif')!;
			const parsedExif = JSON.parse(rawExif);
			width = parsedExif['Image Width'].value;
			height = parsedExif['Image Height'].value;
			const splitPrompt = parsedExif.parameters.value.split('\n');
			positivePrompt = splitPrompt[0];

			for (let i = 1; i < splitPrompt.length; i++) {
				const value = splitPrompt[i];
				if (value.includes('Negative prompt:')) {
					negativePrompt = value.split(': ')[1];
				} else {
					const settingsObject: Record<string, string> = {};
					for (const part of value.split(',')) {
						const splitPart = part.split(': ');
						settingsObject[splitPart[0].trim()] = splitPart[1];
					}
					seed = Number.parseInt(settingsObject.Seed);
					checkpoint = settingsObject.Model;
					sampler = settingsObject.Sampler;
					steps = Number.parseInt(settingsObject.Steps);
					cfgScale = Number.parseInt(settingsObject['CFG scale']);

					if (settingsObject['Hires upscaler']) {
						highResUpscaler = settingsObject['Hires upscaler'];
						isHighResEnabled = true;
						highResDenoisingStrength = Number.parseFloat(settingsObject['Denoising strength']);
						upscaleBy = Number.parseFloat(settingsObject['Hires upscale']);
					}

					if (settingsObject.Refiner) {
						isRefinerEnabled = true;
						console.log(settingsObject.Refiner.trim().split(' ')[0]);
						refinerCheckpoint = settingsObject.Refiner.trim().split(' ')[0];
						refinerSwitchAt = Number.parseFloat(settingsObject['Refiner switch at']);
					}
				}
			}
		}
	}

	async function generate() {
		const prompt = new SDPromptBuilder();
		prompt
			.withPositivePrompt(positivePrompt)
			.withNegativePrompt(negativePrompt)
			.withSampler(sampler)
			.withSteps(steps)
			.withSize(width, height)
			.withSeed(seed)
			.withCheckpoint(checkpoint)
			.withCfgScale(cfgScale);

		if (isRefinerEnabled) {
			prompt.withRefiner({
				refinerCheckpoint,
				switchAt: refinerSwitchAt
			});
		}

		if (isHighResEnabled) {
			prompt.withHighResOptions({
				denoisingStrength: highResDenoisingStrength,
				steps: highResSteps,
				upscaleBy,
				upscaler: highResUpscaler
			});
		}

		isGeneratingImage = true;
		try {
			const result = await HttpService.post<{
				items: { fileName: string; id: number; exif: string }[];
			}>(`/sd/prompt`, prompt.build());
			generatedImage = result.items[0];
			lastGenExif = JSON.parse(result.items[0].exif);
			console.log(lastGenExif);
			if ($page.url.searchParams.has('inputExif')) {
				goto('/stablediffusion/generator');
			}
		} catch {
			// TODO
		} finally {
			isGeneratingImage = false;
		}
	}

	async function interrupt() {
		await HttpService.post('/sd/interrupt');
	}

	async function savePrompt(name: string) {
		const newPrompt = await HttpService.post<SavedPrompt>('/sd/prompts', {
			name,
			cfgScale,
			checkpoint,
			positivePrompt,
			negativePrompt,
			width,
			height,
			sampler,
			steps,
			highRes: isHighResEnabled
				? {
						denoisingStrength: highResDenoisingStrength,
						steps: highResSteps,
						upscaleBy,
						upscaler: highResUpscaler
					}
				: undefined
		});
		promptId = newPrompt.id!;
		createToast('Prompt saved successfully!');
	}

	async function updatePrompt() {
		await HttpService.put(`/sd/prompts/${promptId}`, {
			name: promptName,
			cfgScale,
			checkpoint,
			positivePrompt,
			negativePrompt,
			width,
			height,
			sampler,
			steps,
			highRes: isHighResEnabled
				? {
						denoisingStrength: highResDenoisingStrength,
						steps: highResSteps,
						upscaleBy,
						upscaler: highResUpscaler
					}
				: undefined
		});
		createToast('Prompt updated successfully!');
	}

	function loadPrompt(prompt: SavedPrompt) {
		width = prompt.width;
		height = prompt.height;
		cfgScale = prompt.cfgScale;
		sampler = prompt.sampler;
		checkpoint = prompt.checkpoint;
		promptName = prompt.name;
		positivePrompt = prompt.positivePrompt;
		negativePrompt = prompt.negativePrompt;
		steps = prompt.steps;
		isHighResEnabled = !!prompt.highRes;
		promptId = prompt.id ?? '';
		refinerCheckpoint =
			checkpoints.find((checkpoint) => checkpoint.model_name !== prompt.checkpoint)?.model_name ??
			prompt.checkpoint;

		if (prompt.highRes) {
			highResDenoisingStrength = prompt.highRes.denoisingStrength;
			highResSteps = prompt.highRes.steps;
			upscaleBy = prompt.highRes.upscaleBy;
			highResUpscaler = prompt.highRes.upscaler;
		}
	}

	function clearPrompt() {
		promptId = '';
		promptName = '';
		positivePrompt = '';
		negativePrompt = '';
		checkpoint;
		width = 512;
		height = 512;
		sampler = '';
		steps = 20;
		seed = -1;
		cfgScale = 7;
		isHighResEnabled = false;
		upscaleBy = 2;
		highResUpscaler = '';
		highResSteps = 0;
		highResDenoisingStrength = 0.7;
	}

	function onDeletePrompt(prompt: SavedPrompt) {
		if (prompt.id === promptId) {
			clearPrompt();
		}
	}

	function setSeedFromLastGen() {
		if (!lastGenExif) return;
		const value = lastGenExif.parameters.value;
		// Bad performance
		for (const entry of value.split(',')) {
			if (entry.includes('Seed:')) {
				seed = Number.parseInt(entry.split(' ')[2]);
			}
		}
	}

	function onLoraClick(lora: SDLora) {
		positivePrompt += `, <lora:${lora.name}:1>`;
	}

	beforeNavigate(async () => {
		await HttpService.post(`/sd/inactive`);
	});

	onMount(() => {
		vaultStore.subscribe((vault) => {
			if (vault) {
				void setup(vault);
			}
		});
	});
</script>

<div class=" bg-zinc-900 rounded-md p-4 flex flex-1 flex-col">
	<div class="flex justify-between">
		<div class="flex gap-2 items-center">
			<div>Prompt</div>
			<Tooltip>
				<Button onClick={() => (isSearchingPrompts = true)} slot="target" class="h-full">
					<SearchIcon />
				</Button>
				<div slot="toolTipContent">Search saved prompts</div>
			</Tooltip>
		</div>
		<div class="flex gap-2">
			<div class="flex relative">
				<Tooltip>
					<Button
						onClick={() => {
							if (promptId) {
								updatePrompt();
							} else {
								isSavingPrompt = true;
							}
						}}
						slot="target"
						class="flex gap-2 rounded-tr-none rounded-br-none"
					>
						<div>
							{#if promptId}
								Update Prompt
							{:else}
								Save Prompt
							{/if}
						</div>
						<SaveIcon />
					</Button>
					<div slot="toolTipContent">Save current prompt & Settings</div>
				</Tooltip>
				<Button
					onClick={() => {
						if (promptId) {
							areSaveOptionsExpanded = !areSaveOptionsExpanded;
						}
					}}
					class={`${!promptId && 'cursor-not-allowed fill-zinc-900'} rounded-tl-none rounded-bl-none border-l-2 border-zinc-800`}
				>
					{#if areSaveOptionsExpanded}
						<ChevronUp />
					{:else}
						<ChevronDown />
					{/if}
				</Button>
				{#if areSaveOptionsExpanded}
					<div class="absolute top-[40px] w-full">
						<Button
							onClick={() => {
								isSavingPrompt = true;
								areSaveOptionsExpanded = false;
							}}
							class="h-[40px] w-full"
						>
							Save as new
						</Button>
					</div>
				{/if}
			</div>
			{#if isGeneratingImage}
				<Button onClick={() => interrupt()} class="h-[40px]">Interrupt</Button>
			{:else}
				<Button onClick={() => generate()} class="h-[40px]">Generate</Button>
			{/if}
		</div>
	</div>
	<div class="flex flex-col flex-1">
		<div class="flex flex-col">
			<div>Prompt</div>
			<TextArea bind:value={positivePrompt} />
		</div>
		<div class="flex flex-col">
			<div>Negative Prompt</div>
			<TextArea bind:value={negativePrompt} />
		</div>

		<div class="flex gap-4 pt-4">
			<div class="flex flex-[0.6] flex-col gap-2">
				<div class="flex gap-1">
					<button
						on:click={() => (selectedTab = 'GENERAL')}
						class={`tab-option min-w-[15%] flex justify-center ${selectedTab === 'GENERAL' ? 'active-tab-option bg-red-950 font-bold' : 'bg-zinc-950 hover:bg-red-900'}`}
					>
						General
					</button>
					<button
						on:click={() => (selectedTab = 'HIGHRES')}
						class={`tab-option min-w-[15%] flex justify-center flex gap-2 ${selectedTab === 'HIGHRES' ? 'active-tab-option bg-red-950 font-bold' : 'bg-zinc-950 hover:bg-red-900'}`}
					>
						<input
							on:click={(e) => e.stopPropagation()}
							bind:checked={isHighResEnabled}
							type="checkbox"
						/> <span>High Res</span>
					</button>
					<button
						on:click={() => (selectedTab = 'LORAS')}
						class={`tab-option min-w-[15%] flex justify-center ${selectedTab === 'LORAS' ? 'active-tab-option bg-red-950 font-bold' : 'bg-zinc-950 hover:bg-red-900'}`}
					>
						Loras
					</button>
					<button
						on:click={() => (selectedTab = 'WILDCARDS')}
						class={`tab-option min-w-[15%] flex justify-center ${selectedTab === 'WILDCARDS' ? 'active-tab-option bg-red-950 font-bold' : 'bg-zinc-950 hover:bg-red-900'}`}
					>
						Wildcards
					</button>
				</div>
				<div class="flex">
					{#if selectedTab === 'GENERAL'}
						<GeneralSettings
							bind:samplingSteps={steps}
							bind:samplers
							bind:checkpoints
							bind:selectedSampler={sampler}
							bind:selectedCheckpoint={checkpoint}
							bind:width
							bind:height
							bind:seed
							bind:cfgScale
							bind:refinerCheckpint={refinerCheckpoint}
							bind:refinerSwitchAt
							bind:isRefinerEnabled
							class={'flex flex-col flex-1'}
						/>
					{/if}
					{#if selectedTab === 'HIGHRES'}
						<HighResSettings
							bind:selectedUpscaler={highResUpscaler}
							bind:steps={highResSteps}
							bind:denoisingStrength={highResDenoisingStrength}
							bind:upscaleBy
							bind:upscalers
						/>
					{/if}
					{#if selectedTab === 'LORAS'}
						<LoraSelector bind:loras bind:allTags lastGen={generatedImage} {onLoraClick} />
					{/if}
					{#if selectedTab === 'WILDCARDS'}
						<WildcardManager bind:wildcards />
					{/if}
				</div>
			</div>
			<div class="flex flex-[0.4] items-center justify-center bg-surface-color">
				{#if isGeneratingImage}
					<img class="w-[45px] h-[45px]" src={loadingSpinner} alt="spinner" />
				{:else if generatedImage}
					<PreviewImage
						imageName={generatedImage.fileName}
						imageId={generatedImage.id}
						onDeletion={() => (generatedImage = undefined)}
						onSetSeed={setSeedFromLastGen}
					/>
				{/if}
			</div>
		</div>
	</div>
</div>
{#if isSearchingPrompts}
	<PromptSearch bind:isOpen={isSearchingPrompts} onSelectPrompt={loadPrompt} {onDeletePrompt} />
{/if}
{#if isSavingPrompt}
	<PromptSaveModal onSubmit={savePrompt} bind:isOpen={isSavingPrompt} bind:promptName />
{/if}

<svelte:head>
	<title>NoriBooru - SD Generator</title>
</svelte:head>

<style>
	.tab-option {
		height: 40px;
		display: flex;
		align-items: center;
		padding-left: 4px;
	}
</style>

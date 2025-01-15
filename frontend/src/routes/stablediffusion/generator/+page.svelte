<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import { page } from '$app/stores';
	import loadingSpinner from '$lib/assets/tail-spin.svg';
	import { endpoints } from '$lib/endpoints';
	import { HttpService } from '$lib/services/HttpService';
	import type { MediaItemMetadata } from '$lib/types/MediaItem';
	import type { PopulatedTag } from '$lib/types/PopulatedTag';
	import type { SavedPrompt } from '$lib/types/SavedPrompt';
	import type { SDCheckpoint } from '$lib/types/SD/SDCheckpoint';
	import type { SDLora } from '$lib/types/SD/SDLora';
	import type { SDSampler } from '$lib/types/SD/SDSampler';
	import type { SDScheduler } from '$lib/types/SD/SDSchedulers';
	import type { SDUpscaler } from '$lib/types/SD/SDUpscaler';
	import type { SDWildcard } from '$lib/types/SD/SDWildcard';
	import type { Vault } from '$lib/types/Vault';
	import { processPrompt } from '$lib/utils/promptUtils';
	import { SDPromptBuilder } from '$lib/utils/SDPromptBuilder';
	import {
		Button,
		Checkbox,
		ChevronDown,
		ChevronUp,
		createToast,
		LoadingSpinner,
		SaveIcon,
		SearchIcon,
		Tooltip
	} from '@lendruk/personal-svelte-ui-lib';
	import { onMount } from 'svelte';
	import { isSdStarting, isSdStopping, vaultStore } from '../../../store';
	import PreviewImages from './components/PreviewImages.svelte';
	import ProgressTracker from './components/ProgressTracker.svelte';
	import BlockPrompt from './components/prompting/BlockPrompt.svelte';
	import SimplePrompt from './components/prompting/SimplePrompt.svelte';
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

	let generatedImages:
		| { fileName: string; id: number; isArchived: boolean; metadata: MediaItemMetadata }[]
		| undefined = undefined;

	let selectedTab: 'GENERAL' | 'HIGHRES' | 'LORAS' | 'WILDCARDS' = 'GENERAL';
	let promptMode: 'SIMPLE' | 'BLOCK' = 'SIMPLE';
	let isSearchingPrompts = false;
	let isSavingPrompt = false;
	let areSaveOptionsExpanded = false;
	let autoTag = false;

	// Loading flags
	let isGeneratingImage = false;

	// General settings
	let promptId: string = '';
	let promptName: string = '';
	let positivePrompt: string = '';
	let negativePrompt: string = '';
	let checkpointId: string;
	let width = 512;
	let height = 512;
	let sampler = '';
	let steps = 20;
	let seed = -1;
	let cfgScale = 7;
	let numberOfGenerations = 1;
	let imagesPerGeneration = 1;

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

	let usedLoras: string[] = [];

	async function setup(vault: Vault) {
		if (!vault.hasInstalledSD) return;

		$isSdStarting = true;
		await HttpService.post(endpoints.sdStart());
		const [
			fetchedSamplers,
			fetchedCheckpoints,
			fetchedSchedulers,
			fetchedUpscalers,
			fetchedLoras,
			fetchedTags,
			fetchedWildcards
		] = await Promise.all([
			HttpService.get<SDSampler[]>(endpoints.sdSamplers()),
			HttpService.get<SDCheckpoint[]>(endpoints.sdCheckpoints()),
			HttpService.get<SDScheduler[]>(endpoints.sdSchedulers()),
			HttpService.get<SDUpscaler[]>(endpoints.sdUpscalers()),
			HttpService.get<SDLora[]>(endpoints.sdLoras()),
			HttpService.get<PopulatedTag[]>(endpoints.tags()),
			HttpService.get<SDWildcard[]>(endpoints.wildCards())
		]);

		allTags = fetchedTags;
		samplers = fetchedSamplers;
		checkpoints = fetchedCheckpoints;
		schedulers = fetchedSchedulers;
		upscalers = fetchedUpscalers;
		loras = fetchedLoras;
		wildcards = fetchedWildcards;

		checkpointId = checkpoints[0]?.id;
		sampler = samplers[0].name;
		highResUpscaler = upscalers[0].name;
		if (checkpoints.length > 1) {
			refinerCheckpoint = checkpoints[1].name;
		}

		if ($page.url.searchParams.has('inputMetadata')) {
			const rawMetadata = $page.url.searchParams.get('inputMetadata')!;
			const parsedMetadata = JSON.parse(decodeURIComponent(rawMetadata)) as MediaItemMetadata;
			width = parsedMetadata.width;
			height = parsedMetadata.height;
			positivePrompt = parsedMetadata.positivePrompt;
			negativePrompt = parsedMetadata.negativePrompt;
			seed = parsedMetadata.seed;
			sampler = parsedMetadata.sampler;
			console.log(sampler);
			cfgScale = parsedMetadata.cfgScale;
			steps = parsedMetadata.steps;

			const installedSDCheckpointId = checkpoints.find(
				(chk) => chk.name === parsedMetadata.model
			)?.id;

			if (installedSDCheckpointId) {
				checkpointId = installedSDCheckpointId;
			} else {
				checkpointId = checkpoints[0].id;
				createToast(`Cannot apply checkpoint ${parsedMetadata.model}: it is not installed`);
			}
			if (parsedMetadata.upscaler) {
				highResUpscaler = parsedMetadata.upscaler;
				upscaleBy = parsedMetadata.upscaleBy;
				highResDenoisingStrength = parsedMetadata.denoisingStrength;
				isHighResEnabled = true;
			}

			// 		if (settingsObject.Refiner) {
			// 			isRefinerEnabled = true;
			// 			refinerCheckpoint = settingsObject.Refiner.trim().split(' ')[0];
			// 			refinerSwitchAt = Number.parseFloat(settingsObject['Refiner switch at']);
			// 		}
			// 	}
			// }
		}

		$isSdStarting = false;
	}

	async function generate() {
		const prompt = new SDPromptBuilder();
		const checkpoint = checkpoints.find((ch) => ch.id === checkpointId)!;
		prompt
			.withPositivePrompt(processPrompt(wildcards, positivePrompt))
			.withNegativePrompt(processPrompt(wildcards, negativePrompt))
			.withSampler(sampler)
			.withSteps(steps)
			.withSize(width, height)
			.withSeed(seed)
			.withCheckpoint(checkpoint.name)
			.withBatching(numberOfGenerations, imagesPerGeneration)
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
				items: { fileName: string; id: number; metadata: MediaItemMetadata; isArchived: boolean }[];
			}>(endpoints.sdPrompts(), {
				prompt: prompt.build(),
				autoTag,
				checkpointId,
				loras: usedLoras
			});
			generatedImages = result.items;
			if ($page.url.searchParams.has('inputMetadata')) {
				goto('/stablediffusion/generator');
			}
		} catch {
			// TODO
		} finally {
			isGeneratingImage = false;
		}
	}

	async function interrupt() {
		await HttpService.post(endpoints.sdInterrupt());
	}

	async function savePrompt(name: string) {
		const newPrompt = await HttpService.post<SavedPrompt>(endpoints.sdPrompts(), {
			name,
			cfgScale,
			checkpoint: checkpointId,
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
		await HttpService.put(endpoints.sdPrompt({ id: promptId }), {
			name: promptName,
			cfgScale,
			checkpoint: checkpointId,
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
		checkpointId = prompt.checkpoint;
		promptName = prompt.name;
		positivePrompt = prompt.positivePrompt;
		negativePrompt = prompt.negativePrompt;
		steps = prompt.steps;
		isHighResEnabled = !!prompt.highRes;
		promptId = prompt.id ?? '';
		refinerCheckpoint =
			checkpoints.find((checkpoint) => checkpoint.name !== prompt.checkpoint)?.name ??
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
		checkpointId;
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

	function setSeedFromLastGen(lastGenSeed: number) {
		seed = lastGenSeed;
	}

	function onLoraClick(lora: SDLora) {
		positivePrompt += `, <lora:${lora.name}:1>`;
		usedLoras.push(lora.id);
	}

	async function stopSdUi() {
		isSdStopping.set(true);
		await HttpService.post(endpoints.stopSDUi());
		isSdStopping.set(false);
		goto('/');
	}

	beforeNavigate(async () => {
		await HttpService.post(endpoints.maskSDInactive());
	});

	onMount(() => {
		vaultStore.subscribe((vault) => {
			if (vault) {
				void setup(vault);
			}
		});
	});
</script>

<div class=" bg-zinc-900 rounded-md p-4 flex flex-1 flex-col relative">
	<div class="flex justify-between">
		<div class="flex flex-1 gap-4 items-center">
			<div class="flex flex-[0.25] gap-2 items-center">
				<div>Prompt Mode:</div>
				<div class="flex flex-1">
					<button
						on:click={() => (promptMode = 'SIMPLE')}
						class={`${promptMode === 'SIMPLE' ? 'bg-red-950' : 'bg-zinc-950 hover:bg-red-900 hover:transition'} h-[40px] rounded-l-md w-[50%]`}
						>Simple</button
					>
					<button
						on:click={() => (promptMode = 'BLOCK')}
						class={`${promptMode === 'BLOCK' ? 'bg-red-950' : 'bg-zinc-950 hover:bg-red-900 hover:transition'} h-[40px] rounded-r-md w-[50%]`}
						>Block</button
					>
				</div>
			</div>
			<Tooltip>
				<Button onClick={() => (isSearchingPrompts = true)} slot="target" class="h-full flex gap-2">
					<div>Search Prompts</div>
					<SearchIcon />
				</Button>
				<div slot="toolTipContent">Search saved prompts</div>
			</Tooltip>
		</div>
		<div class="flex gap-2">
			<Button onClick={stopSdUi}>Stop SDUi</Button>
			<Checkbox bind:checked={autoTag} inlineLabel={'Auto tag'} />
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
		{#if promptMode === 'SIMPLE'}
			<SimplePrompt bind:negativePrompt bind:positivePrompt />
		{:else}
			<BlockPrompt />
		{/if}
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
							bind:selectedCheckpoint={checkpointId}
							bind:width
							bind:height
							bind:seed
							bind:cfgScale
							bind:refinerCheckpint={refinerCheckpoint}
							bind:refinerSwitchAt
							bind:isRefinerEnabled
							bind:numberOfGenerations
							bind:imagesPerGeneration
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
						<LoraSelector bind:loras bind:allTags lastGen={generatedImages?.[0]} {onLoraClick} />
					{/if}
					{#if selectedTab === 'WILDCARDS'}
						<WildcardManager bind:wildcards />
					{/if}
				</div>
			</div>
			<div class="flex flex-col flex-[0.4]">
				<div class="flex flex-1 items-center justify-center bg-surface-color">
					{#if isGeneratingImage}
						<img class="w-[45px] h-[45px]" src={loadingSpinner} alt="spinner" />
					{:else if generatedImages}
						<PreviewImages images={generatedImages} onSetSeed={setSeedFromLastGen} />
					{/if}
				</div>
				<ProgressTracker bind:isGeneratingImage />
			</div>
		</div>
	</div>
	{#if $isSdStarting || $isSdStopping}
		<div
			class="absolute w-full h-full top-0 left-0 backdrop-blur-lg flex items-center justify-center rounded-md gap-4"
		>
			<div class="text-4xl">{$isSdStarting ? 'SDUi is Starting...' : 'SDUi is Stopping...'}</div>
			<LoadingSpinner />
		</div>
	{/if}
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

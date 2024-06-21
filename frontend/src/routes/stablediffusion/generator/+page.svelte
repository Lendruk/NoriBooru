<script lang="ts">
	import Button from "$lib/Button.svelte";
  import { HttpService } from "$lib/services/HttpService";
	import { onMount } from "svelte";
	import { vaultStore } from "../../../store";
	import { beforeNavigate } from "$app/navigation";
	import TextArea from "$lib/components/TextArea.svelte";
	import type { SDCheckpoint } from "$lib/types/SD/SDCheckpoint";
	import type { SDSampler } from "$lib/types/SD/SDSampler";
	import type { SDScheduler } from "$lib/types/SD/SDSchedulers";
	import { SDPromptBuilder } from "$lib/utils/SDPromptBuilder";
	import GeneralSettings from "./components/GeneralSettings.svelte";
	import Select from "$lib/components/Select.svelte";
  import loadingSpinner from '$lib/assets/tail-spin.svg';
	import PreviewImage from "./components/PreviewImage.svelte";
	import HighResSettings from "./components/HighResSettings.svelte";
	import type { SDUpscaler } from "$lib/types/SD/SDUpscaler";

  let checkpoints: SDCheckpoint[] = [];
  let samplers: SDSampler[] = [];
  let schedulers: SDScheduler[] = [];
  let upscalers: SDUpscaler[] = [];

  let currentCheckpoint: string;

  let positivePrompt: string = '';
  let negativePrompt: string = '';

  let generatedImage: { fileName: string, id: number } | undefined = undefined;

  let selectedTab:  'GENERAL' | 'HIGHRES' | 'LORAS' = 'GENERAL';
  let isGeneratingImage = false;

  // General settings
  let width = 512;
  let height = 512;
  let selectedSampler = '';
  let steps = 20;
  let seed = -1;
  let cfgScale = 7;

  // High res
  let isHighResEnabled = false;
  let upscaleBy = 2;
  let highResUpscaler = "";
  let highResSteps = 0;
  let highResDenoisingStrength = 0.7;

  async function setup() {
    samplers = await HttpService.get(`/sd/samplers`);
    checkpoints = await HttpService.get(`/sd/checkpoints`);
    schedulers = await HttpService.get(`/sd/schedulers`);
    upscalers = await HttpService.get(`/sd/highres/upscalers`);

    currentCheckpoint = checkpoints[0].model_name;
    selectedSampler = samplers[0].name;
    highResUpscaler = upscalers[0].name;
    // await HttpService.post(`/sd/start`, {});
  }

  async function generate() {
    const prompt = new SDPromptBuilder();
    prompt.withPositivePrompt(positivePrompt)
    .withNegativePrompt(negativePrompt)
    .withSampler(selectedSampler)
    .withSteps(steps)
    .withSize(width, height)
    .withSeed(seed)
    .withCheckpoint(currentCheckpoint)
    .withCfgScale(cfgScale);

    if (isHighResEnabled) {
      prompt.withHighResOptions({
        denoisingStrength: highResDenoisingStrength,
        steps: highResSteps,
        upscaleBy,
        upscaler: highResUpscaler
      })
    }

    isGeneratingImage = true;
    try {
      const result = await HttpService.post<{ items: { fileName: string, id: number }[] }>(`/sd/prompt`, prompt.build());
      generatedImage = result.items[0];
    } catch {
      // TODO
    } finally {
      isGeneratingImage = false;
    }
  }

  async function interrupt() {
    await HttpService.post('/sd/interrupt');
  }


  beforeNavigate(async () => {
    await HttpService.post(`/sd/inactive`);
  });

  onMount(() => {
    void setup();
  });
</script>

<div class="m-2 bg-zinc-900 rounded-md p-4 flex flex-1 flex-col">
  <div class="flex justify-between">
    <div>
      Prompt Mode
    </div>
    <div class="flex">
      <Select bind:value={currentCheckpoint}>
        {#each checkpoints as checkpoint}
          <option value={checkpoint.model_name}>{checkpoint.model_name}</option>
        {/each}
      </Select>
      {#if isGeneratingImage}
        <Button onClick={() => interrupt()} class="h-[40px]">
          Interrupt
        </Button>
      {:else}
        <Button onClick={() => generate()} class="h-[40px]">
          Generate
        </Button>
      {/if}
    </div>
  </div>
  <div class="flex flex-col flex-1">
    <div class="flex flex-col">
      <div>Prompt</div>
      <TextArea bind:value={positivePrompt}  />
    </div>
    <div class="flex flex-col">
      <div>Negative Prompt</div>
      <TextArea bind:value={negativePrompt}/>
    </div>

    <div class="flex pt-4 gap-2">
      <div class="flex flex-col w-[10%]">
        <button on:click={() => selectedTab = "GENERAL"} class={`tab-option ${selectedTab === 'GENERAL' ? 'active-tab-option bg-red-950' : ''}`}>
          General
        </button>
        <button on:click={() => selectedTab = "HIGHRES"}  class={`tab-option flex gap-2 ${selectedTab === 'HIGHRES' ? 'active-tab-option bg-red-950' : ''}`}>
          <input on:click={(e) => e.stopPropagation() } bind:checked={isHighResEnabled} type="checkbox" /> <span>High Res</span>
        </button>
        <button on:click={() => selectedTab = "LORAS"}  class={`tab-option ${selectedTab === 'LORAS' ? 'active-tab-option bg-red-950' : ''}`}>
          Loras
        </button>
      </div>
      <div class="flex flex-1">
        <GeneralSettings 
          bind:samplingSteps={steps}
          bind:samplers={samplers}
          bind:selectedSampler={selectedSampler}
          bind:width={width} 
          bind:height={height} 
          bind:seed={seed}
          bind:cfgScale={cfgScale}
          class={selectedTab === 'GENERAL' ? 'visible flex flex-col flex-1' : 'hidden'}
        />
        <div class={selectedTab === 'HIGHRES' ? 'visible' : 'hidden'}>
          <HighResSettings 
            bind:upscaler={highResUpscaler}
            bind:steps={highResSteps}
            bind:denoisingStrength={highResDenoisingStrength}
            bind:upscaleBy={upscaleBy}
            bind:upscalers={upscalers}
          />
        </div>
        <div class={selectedTab === 'LORAS' ? 'visible' : 'hidden'}>
          Loras
        </div>
      </div>
      <div class="flex flex-1 items-center justify-center bg-surface-color">
        {#if isGeneratingImage}
          <img class="w-[45px] h-[45px]" src={loadingSpinner} alt="spinner" />
        {:else}
          {#if generatedImage}
            <PreviewImage imageName={generatedImage.fileName} imageId={generatedImage.id} onDeletion={() => generatedImage = undefined }/>
          {/if}
        {/if}
      </div>
    </div>
  </div>

  {#if $vaultStore?.hasInstalledSD}
    Has installed sd
  {:else}
    NO sd install
  {/if}
</div>
<style>
  .tab-option {
    height: 40px;
    display: flex;
    align-items: center;
    padding-left: 4px;
  }
</style>
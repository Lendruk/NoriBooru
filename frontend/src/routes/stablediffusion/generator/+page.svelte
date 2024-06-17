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
	import type { SDPromptResponse } from "$lib/types/SD/SDPromptResponse";
	import GeneralSettings from "./components/GeneralSettings.svelte";
	import Select from "$lib/components/Select.svelte";

  let checkpoints: SDCheckpoint[] = [];
  let samplers: SDSampler[] = [];
  let schedulers: SDScheduler[] = [];

  let currentCheckpoint: string;

  let positivePrompt: string = '';
  let negativePrompt: string = '';

  let generatedImage: string;

  let selectedTab:  'GENERAL' | 'HIGHRES' | 'OTHER2' = 'GENERAL';

  // General settings
  let width = 512;
  let height = 512;
  let selectedSampler = '';
  let steps = 20;

  async function setup() {

    samplers = await HttpService.get(`/sd/samplers`);
    checkpoints = await HttpService.get(`/sd/checkpoints`);
    schedulers = await HttpService.get(`/sd/schedulers`);

    currentCheckpoint = checkpoints[0].model_name;
    selectedSampler = samplers[0].name;
    // await HttpService.post(`/sd/start`, {});
  }

  async function generate() {
    const prompt = new SDPromptBuilder();
    prompt.withPositivePrompt(positivePrompt)
    .withSampler(selectedSampler)
    .withSteps(steps)
    .withSize(width, height);
    
    const result = await HttpService.post<SDPromptResponse>(`/sd/prompt`, prompt.build());
    generatedImage = result.images[0];

    for(const image of result.images) {
      await HttpService.post(`/images`, { image });
    }
  }

  beforeNavigate(async () => {
    await HttpService.post(`/sd/inactive`, {});
  });

  onMount(() => {
    void setup();
  });
</script>

<div class="m-2 bg-zinc-900 rounded-md p-4 flex flex-col">
  <div class="flex flex-1 justify-between">
    <div>
      Prompt Mode
    </div>
    <div class="flex">
      <Select bind:value={currentCheckpoint}>
        {#each checkpoints as checkpoint}
          <option value={checkpoint.model_name}>{checkpoint.model_name}</option>
        {/each}
      </Select>
      <Button onClick={() => generate()} class="h-[40px]">
        Generate
      </Button>
    </div>
  </div>
  <div class="flex flex-col">
    <div class="flex flex-col">
      <div>Prompt</div>
      <TextArea bind:value={positivePrompt}  />
    </div>
    <div class="flex flex-col">
      <div>Negative Prompt</div>
      <TextArea bind:value={negativePrompt}/>
    </div>

    <div class="flex pt-4">
      <div class="flex flex-col w-[10%]">
        <button on:click={() => selectedTab = "GENERAL"} class={`tab-option ${selectedTab === 'GENERAL' ? 'active-tab-option bg-red-950' : ''}`}>
          General
        </button>
        <button on:click={() => selectedTab = "HIGHRES"}  class={`tab-option ${selectedTab === 'HIGHRES' ? 'active-tab-option bg-red-950' : ''}`}>
          High Res
        </button>
        <button on:click={() => selectedTab = "OTHER2"}  class={`tab-option ${selectedTab === 'OTHER2' ? 'active-tab-option bg-red-950' : ''}`}>
          Other2
        </button>
      </div>
      <div class="flex flex-1">
        <GeneralSettings 
          bind:samplingSteps={steps}
          bind:samplers={samplers}
          bind:selectedSampler={selectedSampler}
          bind:width={width} 
          bind:height={height} 
          class={selectedTab === 'GENERAL' ? 'visible pl-2' : 'hidden'}
        />
        <div class={selectedTab === 'HIGHRES' ? 'visible' : 'hidden'}>
          High res fix
        </div>
        <div class={selectedTab === 'OTHER2' ? 'visible' : 'hidden'}>
          Other2
        </div>
      </div>
      <div class="flex flex-1">
        <img class="bg-contain" src={`data:image/png; base64, ${generatedImage}`} alt="img" />
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

  .active-tab-option {
  }
</style>
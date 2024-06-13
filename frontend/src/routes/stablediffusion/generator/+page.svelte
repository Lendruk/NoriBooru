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

  let checkpoints: SDCheckpoint[] = [];
  let samplers: SDSampler[] = [];
  let schedulers: SDScheduler[] = [];

  let currentCheckpoint: string;

  let positivePrompt: string = '';
  let negativePrompt: string = '';

  let generatedImage: string;

  async function setup() {

    samplers = await HttpService.get(`/sd/samplers`);
    checkpoints = await HttpService.get(`/sd/checkpoints`);
    schedulers = await HttpService.get(`/sd/schedulers`);

    currentCheckpoint = checkpoints[0].model_name;
    // await HttpService.post(`/sd/start`, {});
  }

  async function generate() {
    const prompt = new SDPromptBuilder();
    prompt.withPositivePrompt(positivePrompt)
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
      <select bind:value={currentCheckpoint} class="text-black">
        {#each checkpoints as checkpoint}
          <option value={checkpoint.model_name}>{checkpoint.model_name}</option>
        {/each}
      </select>
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

    <div>
      <img src={`data:image/png; base64, ${generatedImage}`} alt="img" />
    </div>
  </div>

  {#if $vaultStore?.hasInstalledSD}
    Has installed sd
  {:else}
    NO sd install
  {/if}
</div>
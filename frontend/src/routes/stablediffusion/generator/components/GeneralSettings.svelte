<script lang="ts">
	import Button from "$lib/Button.svelte";
  import Select from "$lib/components/Select.svelte";
	import type { SDSampler } from "$lib/types/SD/SDSampler";

  export { cssClass as class };
  let cssClass = '';

  export let width: number;
  export let height: number;
  export let seed: number;

  export let samplers: SDSampler[];
  export let selectedSampler: string;
  export let samplingSteps: number;

  let sizePresets: [number, number][] = [
    [512, 512],
    [1024, 1024],
    [1344, 768],
    [768, 1344],
    [1280, 768],
    [768, 1280],
  ];

  let aspectRatio = 0;
  $: {
    aspectRatio = width / height;
  }
</script>

<div class={cssClass}>
  General settings

  <div class="flex flex-col flex-1">
    <div>Sampling method</div>
    <Select class="h-[40px]" bind:value={selectedSampler}>
      {#each samplers as sampler}
        <option value={sampler.name}>{sampler.name}</option>
      {/each}
    </Select>
    <div>
      Steps
    </div>
    <input bind:value={samplingSteps} type="number" />
    <div>
      Seed
    </div>
    <input bind:value={seed} type="number" />
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
              <Button onClick={() => { width = preset[0]; height= preset[1] }}>
                {`${preset[0]}x${preset[1]}`}
              </Button>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
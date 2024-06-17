<script lang="ts">
	import Select from "$lib/components/Select.svelte";
	import type { SDSampler } from "$lib/types/SD/SDSampler";

  export { cssClass as class };
  let cssClass = '';

  export let width: number;
  export let height: number;

  export let samplers: SDSampler[];
  export let selectedSampler: string;
  export let samplingSteps: number;

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
      <div>Size</div>

      <div class="flex gap-4">
        <div>
          <div>
            <div>Width</div>
            <input bind:value={width} type="number" />
          </div>
          <div>
            <div>Height</div>
            <input bind:value={height} type="number" />
          </div>
        </div>
        <div class="flex items-center">
          <div class="bg-red-950" style={`width:${128}px; height:${128 / aspectRatio}px`}></div>
        </div>
      </div>
    </div>
  </div>
</div>
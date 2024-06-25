<script lang="ts">
	import Select from "$lib/components/Select.svelte";
	import type { SDUpscaler } from "$lib/types/SD/SDUpscaler";
  export { cssClass as class };

  export let selectedUpscaler: string;
  export let steps: number;
  export let denoisingStrength: number;
  export let upscaleBy: number;
  export let upscalers: SDUpscaler[];

  let cssClass = ''; 
</script>

<div class={cssClass}>
  <div>
    <div>
      Upscaler
    </div>
    <Select bind:value={selectedUpscaler}>
      {#each upscalers as upscaler}
        <option value={upscaler.name}>{upscaler.name ?? upscaler.model_name}</option>
      {/each}
    </Select>
  </div>
  <div class="flex gap-2">
    <div>
      <div>
        Steps
      </div>
      <input bind:value={steps} type="number" />
    </div>
    <div>
      <div>
        Denoising strength
      </div>
      <input bind:value={denoisingStrength} type="number" />
    </div>
  </div>
  <div class="flex gap-2">
    <div>
      <div>
        Upscale by
      </div>
      <input bind:value={upscaleBy} type="number" />
    </div>
  </div>
</div>
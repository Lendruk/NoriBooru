<script lang="ts">
	import Select from "$lib/components/Select.svelte";
import type { SDCheckpoint } from "$lib/types/SD/SDCheckpoint";
	import LabeledComponent from "../../../components/LabeledComponent.svelte";

  export let currentCheckpoint: string;
  export let currentRefinerCheckpoint: string;
  export let refinerSwitchAt: number;
  export let checkpoints: SDCheckpoint[];
  export let isRefinerEnabled: boolean;
</script>

<div>
  <div>
    Refiner Checkpoint <input type="checkbox" bind:checked={isRefinerEnabled} />
  </div>

  <Select bind:value={currentRefinerCheckpoint}>
    {#each checkpoints.filter(check => check.model_name !== currentCheckpoint) as checkpoint}
      <option value={checkpoint.model_name}>{checkpoint.model_name}</option>
    {/each}
  </Select>

  <div class="flex flex-col">
    <LabeledComponent>
      <div slot="label" class="flex gap-2">
        <div>
          Switch At
        </div>
        <input type="number" bind:value={refinerSwitchAt} />
      </div>
      <input slot="content" type="range" min={0} max={1} step={0.1} bind:value={refinerSwitchAt}/>
    </LabeledComponent>
  </div>
</div>
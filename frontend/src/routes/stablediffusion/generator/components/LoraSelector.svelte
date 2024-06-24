<script lang="ts">
	import type { SDLora } from "$lib/types/SD/SDLora";

  export let loras: SDLora[];
  export let onLoraClick: (lora: SDLora) => void;

</script>

<div>
  <div class="text-xl">
    Loras
  </div>
  <div class='flex flex-wrap gap-2'>
    {#each loras as lora}
      <button on:click={() => onLoraClick(lora)} class="w-[150px] h-[200px] bg-zinc-700 flex items-end justify-center">
        <div>{lora.name}</div>
      </button>
    {/each}
  </div>
</div>
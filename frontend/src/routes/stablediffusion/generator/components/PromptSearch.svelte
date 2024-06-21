<script lang="ts">
	import Button from "$lib/Button.svelte";
	import { createToast } from "$lib/components/toast/ToastContainer.svelte";
	import TrashIcon from "$lib/icons/TrashIcon.svelte";
	import { HttpService } from "$lib/services/HttpService";
	import type { SavedPrompt } from "$lib/types/SavedPrompt";
	import { onMount } from "svelte";

  export let isOpen: boolean;
  export let onSelectPrompt: (prompt: SavedPrompt) => void | Promise<void>;

  let prompts: SavedPrompt[] = [];
  let currentOpenPrompt: SavedPrompt | undefined;

  async function getSavedPrompts() {
    const response = await HttpService.get<SavedPrompt[]>('/sd/prompts');
    prompts = response;

    currentOpenPrompt = prompts[0];
  }  

  async function deleteSavedPrompt(id: string) {
    await HttpService.delete(`/sd/prompts/${id}`);

    if (id === currentOpenPrompt?.id) {
      currentOpenPrompt = undefined;
    }

    const index = prompts.findIndex(prompt => prompt.id === id);
    if (index !== -1 ) {
      prompts.splice(index, 1);
      prompts = prompts;
    }
    createToast('Prompt deleted successfully!');
  }

  $: {
    if (isOpen) {
      getSavedPrompts();
    } else {
      prompts = [];
    }
  }

  function onKeyPress(event: KeyboardEvent) {
    if (event.key === "Escape") {
      isOpen = false;
    }
  }
</script>

<div class="absolute flex items-center justify-center h-full w-full top-0 left-0 z-50 backdrop-blur-sm">
  <div class="bg-zinc-900 min-h-[80%] min-w-[80%]">
    <div>
      Search saved prompts
    </div>
    <div class="flex">
      <div>
        {#each prompts as prompt}
          <div class="flex">
            <Button class="rounded-none" onClick={() => currentOpenPrompt = prompt }>{prompt.name ?? 'unnamed'}</Button>
            <Button class="rounded-none" onClick={() => deleteSavedPrompt(prompt.id!)}><TrashIcon /></Button>
          </div>
        {/each}
      </div>
      <div>
        {#if currentOpenPrompt}
          <div>
            <div>
              <div>
                Positive Prompt
              </div>
              <div>
                {currentOpenPrompt.positivePrompt}
              </div>
            </div>
            <Button onClick={() => { onSelectPrompt(currentOpenPrompt!); isOpen = false; }}>Select</Button>
          </div>
        {:else}
          <div class="text-8xl">
            No Prompt selected
          </div>
        {/if}
      </div>
    </div>
  </div>
  <!-- <Button onClick={() => isOpen = false }>C</Button> -->
</div>
<svelte:window on:keydown={onKeyPress} />
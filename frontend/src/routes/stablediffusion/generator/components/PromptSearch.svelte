<script lang="ts">
	import Button from "$lib/Button.svelte";
	import { createToast } from "$lib/components/toast/ToastContainer.svelte";
	import TrashIcon from "$lib/icons/TrashIcon.svelte";
	import { HttpService } from "$lib/services/HttpService";
	import type { SavedPrompt } from "$lib/types/SavedPrompt";
	import LabeledComponent from "../../../components/LabeledComponent.svelte";

  export let isOpen: boolean;
  export let onSelectPrompt: (prompt: SavedPrompt) => void | Promise<void>;
  export let onDeletePrompt: (prompt: SavedPrompt) => void | Promise<void>;

  let prompts: SavedPrompt[] = [];
  let currentOpenPrompt: SavedPrompt | undefined;
  let currentOpenPromptName: string | undefined;

  async function getSavedPrompts() {
    const response = await HttpService.get<SavedPrompt[]>('/sd/prompts');
    prompts = response;

    currentOpenPrompt = prompts[0];
    if (currentOpenPrompt) {
      currentOpenPromptName = currentOpenPrompt.name;
    }
  }  

  async function updatePrompt() {
    if (!currentOpenPrompt) return;

    await HttpService.put(`/sd/prompts/${currentOpenPrompt.id}`, { ...currentOpenPrompt, name: currentOpenPromptName });
    const index = prompts.findIndex(prompt => prompt.id === currentOpenPrompt!.id);
    prompts[index].name = currentOpenPromptName ?? 'Unnamed';
    prompts = prompts;
  }

  async function deleteSavedPrompt(id: string) {
    await HttpService.delete(`/sd/prompts/${id}`);

    if (id === currentOpenPrompt?.id) {
      currentOpenPrompt = undefined;
    }
    
    const index = prompts.findIndex(prompt => prompt.id === id);
    if (index !== -1 ) {
      const prompt = prompts.splice(index, 1);
      onDeletePrompt(prompt[0]);
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

  function onBackgroundClick() {
    isOpen = false;
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div on:click={onBackgroundClick} class="absolute flex items-center justify-center h-full w-full top-0 left-0 z-50 backdrop-blur-sm">
  <div on:click={(e) => e.stopPropagation()} class="bg-zinc-900 min-h-[80%] min-w-[80%] p-2">
    <div class="text-4xl pb-2">
      Search saved prompts
    </div>
    <div class="flex">
      <div class="flex-[0.25]">
        {#each prompts as prompt}
          <div class="flex justify-between">
            <Button class="rounded-none h-[40px] flex flex-1" onClick={() => {currentOpenPrompt = prompt; currentOpenPromptName = prompt.name} }>{prompt.name ?? 'unnamed'}</Button>
            <Button class="rounded-none h-[40px]" onClick={() => deleteSavedPrompt(prompt.id!)}><TrashIcon /></Button>
          </div>
        {/each}
      </div>
      <div class="flex flex-1 flex-col pl-2">
        {#if currentOpenPrompt}
          <div>
            <div>
              <LabeledComponent>
                <div slot="label">
                  Prompt name
                </div>
                <div slot="content" class="flex">
                  <input type="text" bind:value={currentOpenPromptName}  /> <Button onClick={() => updatePrompt()}>Update</Button>
                </div>
              </LabeledComponent>
              <LabeledComponent>
                <div slot="label">
                  Positive Prompt
                </div>
                <div slot="content">
                  {currentOpenPrompt.positivePrompt || 'No positive prompt'}
                </div>
              </LabeledComponent>
              <LabeledComponent>
                <div slot="label">
                  Negative Prompt
                </div>
                <div slot="content">
                  {currentOpenPrompt.negativePrompt || 'No negative prompt'}
                </div>
              </LabeledComponent>
              <div class="text-xl">Settings</div>
              <div class="flex gap-4">
                <LabeledComponent>
                  <div slot="label">Size</div>
                  <div slot="content">
                    <div>width: {currentOpenPrompt.width}</div>
                    <div>height: {currentOpenPrompt.height}</div>
                  </div>
                </LabeledComponent>
                <LabeledComponent>
                  <div slot="label">Sampling</div>
                  <div slot="content">
                    <div>sampler: {currentOpenPrompt.sampler}</div>
                    <div>steps: {currentOpenPrompt.steps}</div>
                  </div>
                </LabeledComponent>
              </div>
              <div>
                <LabeledComponent>
                  <div slot="label">High res</div>
                  <div slot="content">
                    <div>Using high res: {!!currentOpenPrompt.highRes}</div>
                    {#if currentOpenPrompt.highRes}
                      <div>Upscaler: {currentOpenPrompt.highRes.upscaler}</div>
                      <div>Upscale by: {currentOpenPrompt.highRes.upscaleBy}</div>
                      <div>Denoising strength: {currentOpenPrompt.highRes.denoisingStrength}</div>
                      <div>Steps: {currentOpenPrompt.highRes.steps}</div>
                    {/if}
                  </div>
                </LabeledComponent>
              </div>
            </div>
            <Button class="h-[40px]" onClick={() => { onSelectPrompt(currentOpenPrompt!); isOpen = false; }}>Select</Button>
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
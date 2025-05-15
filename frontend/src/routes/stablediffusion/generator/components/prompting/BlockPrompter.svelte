<script lang="ts">
	import type { PopulatedTag } from "$lib/types/PopulatedTag";
	import type { SDLora } from "$lib/types/SD/SDLora";
	import type { PromptBody } from "$lib/types/SD/SDPromptRequest";
	import BlockPromptLoraItem from "./prompt-items/BlockPromptLoraItem.svelte";
	import BlockPromptTagItem from "./prompt-items/BlockPromptTagItem.svelte";
	import BlockPromptTextItem from "./prompt-items/BlockPromptTextItem.svelte";
  


  let { tags, loras, currentPrompt = $bindable() }: { tags: PopulatedTag[], loras: SDLora[], currentPrompt: PromptBody } = $props();
  let promptInputValue = $state<string>("");
  

  // Action list items  
  let matchingTags = $state<PopulatedTag[]>([]);
  let matchingLoras = $state<SDLora[]>([]);
  let showingActionList = $state<boolean>(false);
  let actionListFocused = $state<boolean>(false);

  function addTextElementToPrompt() {
    console.log("Adding text element to prompt");
    if (promptInputValue) {
      currentPrompt.push({ text: promptInputValue });
      promptInputValue = "";
      showingActionList = false;
    }
  }

  function addTagElementToPrompt(tag: PopulatedTag) {
    console.log("Adding tag element to prompt");
    if (tag) {
      currentPrompt.push(tag);
      promptInputValue = "";
      showingActionList = false;
    }
  }

  function addLoraElementToPrompt(lora: SDLora) {
    console.log("Adding lora element to prompt");
    if (lora) {
      currentPrompt.push({ lora, strength: 0.5 });
      promptInputValue = "";
      showingActionList = false;
    }
  }

  $effect(() => {
    if (!showingActionList) {
      matchingLoras = [];
      matchingTags = [];
    }
  })
</script>

<div class="flex flex-col flex-1 bg-surface-color rounded-md border-red-950 flex-wrap min-h-[40px]">
  <div class="flex flex-row flex-wrap">
    {#each currentPrompt as promptItem, index (index)}
      <div class="p-2">
        {#if 'text' in promptItem}
          <BlockPromptTextItem text={promptItem.text} onDelete={() => {
            currentPrompt.splice(index, 1);
          }} />
        {:else if 'name' in promptItem}
          <BlockPromptTagItem tag={promptItem} onDelete={() => {
            currentPrompt.splice(index, 1);
          }} />
        {:else if 'lora' in promptItem}
          <BlockPromptLoraItem promptLora={promptItem} onDelete={() => {
            currentPrompt.splice(index, 1);
          }} />
        {:else}
          <span>unsupported</span>
        {/if}
      </div>
    {/each}
  </div>
  <div class="relative">
    <input 
      type="text"
      class="bg-transparent border-none outline-none flex-1"
      placeholder="Add new prompt item..."
      bind:value={promptInputValue}
      onfocusout={() => {
        if (!actionListFocused) {
          showingActionList = false;
        }
      }}
      onkeydown={(e) => {
        if (!e.ctrlKey && e.code === "Enter") {
          const exactTag = tags.find(tag => tag.name.toLowerCase() === promptInputValue.toLowerCase());
          if (exactTag) {
            addTagElementToPrompt(exactTag);
          } else {
            addTextElementToPrompt();
          }
        }
        if (e.ctrlKey && e.code === "Space") {
          // Search tags
          matchingTags = tags.filter(tag => tag.name.toLowerCase().includes(promptInputValue.toLowerCase()));

          // Search loras
          matchingLoras = loras.filter(lora => lora.name.toLowerCase().includes(promptInputValue.toLowerCase()));

          showingActionList = !showingActionList;
        }
      }}
      />
      <div role="menu" onmouseleave={() => { actionListFocused=false}} onmouseenter={() => { actionListFocused=true }} onfocusout={() => {actionListFocused=false; showingActionList=false;} }  class={`${showingActionList ? "absolute" : "hidden"} bg-surface-color flex flex-col border-red-950`}>
        {#each matchingLoras as lora}
          <button onclick={() => addLoraElementToPrompt(lora)}>
            add lora {lora.name}
          </button>
        {/each}
        
        {#each matchingTags as tag}
        <button onclick={() => addTagElementToPrompt(tag)}>
          add tag {tag.name}
        </button>
        {/each}
        <button onclick={() => addTextElementToPrompt()}>
          new text elemnt
        </button>
      </div>
  </div>
</div>
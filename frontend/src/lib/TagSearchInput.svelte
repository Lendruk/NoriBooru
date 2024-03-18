<script lang="ts">
	import Tag from "./Tag.svelte";
	import type { PopulatedTag } from "./types/PopulatedTag";
  
  export let onTagSearchSubmit: (tag: PopulatedTag) => void;
  export let onAppliedTagClick: (tag: PopulatedTag) => void;
  export let availableTags: PopulatedTag[] = [];
  export let appliedTags: PopulatedTag[] = [];
  export let ignoredTags: PopulatedTag[] = [];
  export let limit: number = Number.MAX_SAFE_INTEGER;
  export { cssClass as class};

  let cssClass = "";
  let tagSearchInputText = "";
  let tagSuggestion = "";

  let input: HTMLInputElement;

  function onSubmit(keyCode: string, value: string) {
    if(keyCode === "Enter") {
      const tag = availableTags.find(tag => tag.name.toLowerCase().startsWith(value) && !ignoredTags.find(at => at.id === tag.id));
      if (tag) {
        onTagSearchSubmit(tag);
        tagSuggestion = "";
        tagSearchInputText = "";
        input.style.width = "100%";
      }
    }
  }

  function onKeyDown(e: KeyboardEvent & {
    currentTarget: EventTarget & HTMLInputElement;
  }) {
    if (e.key == "Tab") {
      e.preventDefault();
    }
  }

  function onKeyUp(e: KeyboardEvent & {
    currentTarget: EventTarget & HTMLInputElement;
  }) {
    if (e.key == "Tab") {
      e.preventDefault();
      console.log("tab pressed");
      const tag = availableTags.find(tag => tag.name.toLowerCase().startsWith(e.currentTarget.value.toLowerCase()) && !ignoredTags.find(at => at.id === tag.id));

      if (tag) {
        onTagSearchSubmit(tag);
        tagSuggestion = "";
        tagSearchInputText = "";
        input.style.width = "100%";
      }
    }
  }


  function onTagSearch(target: EventTarget & HTMLInputElement) {
    const value = target.value.toLowerCase();
    if (value) {
      const tag = availableTags.find(tag => tag.name.toLowerCase().startsWith(value.toLowerCase()) && !ignoredTags.find(at => at.id === tag.id));
      if (tag) {
        let remaining = "";
        for(const char of tag.name) {
          if(!value.includes(char.toLowerCase())) {
            remaining += char;
          }
        }
        tagSuggestion = remaining;
      } else {
        tagSuggestion = "";
      }
      input.style.width = value.length + "ch";
    } else {
      input.style.width = "100%";
      tagSuggestion = "";
    }
  }

</script>
<div class={`flex flex-wrap w-full min-h-[40px] p-2 bg-zinc-800 rounded-md ${cssClass}`}>
  <div class="flex flex-row flex-wrap gap-2">
    {#each appliedTags as tag }
      <Tag onClick={() => onAppliedTagClick(tag)} mediaCount={tag.mediaCount} color={tag.color} text={tag.name} />
    {/each}
  </div>
  <div class={`flex items-center flex-1`}>
    {#if appliedTags.length < limit} 
      <input 
        bind:this={input}
        bind:value={tagSearchInputText} 
        on:keydown={onKeyDown}
        on:keyup={onKeyUp}
        on:keypress={(e) => {onSubmit(e.key, tagSearchInputText) }} 
        on:input={(e) => onTagSearch(e.currentTarget)} 
        class="bg-transparent ml-2 flex focus:outline-none w-full" 
        placeholder="Search tags"
        type="text" 
      />
      <span class="text-gray-400">{tagSuggestion}</span>
    {/if}
  </div>
</div>
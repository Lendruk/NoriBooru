<script lang="ts">
	import Tag from "./Tag.svelte";
	import type { TagDef } from "./types/TagDef";
  
  export let onTagSearchSubmit: (value: string) => void;
  export let onAppliedTagClick: (tag: TagDef) => void;
  export let availableTags: TagDef[] = [];
  export let appliedTags: TagDef[] = [];
  export let ignoredTags: TagDef[] = [];
  export { cssClass as class};

  let cssClass = "";
  let tagSearchInputText = "";
  let tagSuggestion = "";

  function onSubmit(keyCode: string, value: string) {
    if(keyCode === "Enter") {
      onTagSearchSubmit(value);
      tagSuggestion = "";
      tagSearchInputText = "";
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
        onTagSearchSubmit(tag.name);
        tagSuggestion = "";
        tagSearchInputText = "";
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
      target.style.width = value.length + "ch";
    } else {
      target.style.width = "100%";
      tagSuggestion = "";
    }
  }

</script>
<div class={`flex flex-1 flex-wrap bg-zinc-800 rounded-md ${cssClass}`}>
  <div class="flex flex-row flex-wrap gap-2">
    {#each appliedTags as tag }
      <Tag onClick={() => onAppliedTagClick(tag)} mediaCount={tag.mediaCount} color={tag.tagType?.color} text={tag.name} />
    {/each}
  </div>
  <div class={`flex items-center flex-1`}>
    <input 
      bind:value={tagSearchInputText} 
      on:keydown={onKeyDown}
      on:keyup={onKeyUp}
      on:keypress={(e) => {onSubmit(e.key, tagSearchInputText) }} 
      on:input={(e) => onTagSearch(e.currentTarget)} 
      class="bg-transparent flex focus:outline-none w-full" 
      type="text" 
    />
    <span class="text-gray-400">{tagSuggestion}</span></div>
</div>
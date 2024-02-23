<script lang="ts">
	import type { Tag } from "$lib/server/db/vault/schema";

  export let onTagSearchSubmit: (value: string) => void;
  export let tags: Tag[] = [];
  export let ignoredTags: Tag[] = [];
  
  let tagSearchInputText = "";
  let tagSuggestion = "";

  function onSubmit(keyCode: string, value: string) {
    if(keyCode === "Enter") {
      onTagSearchSubmit(value);
      tagSuggestion = "";
      tagSearchInputText = "";
    }
  }

  function onTagSearch(target: EventTarget & HTMLInputElement) {
    const value = target.value.toLowerCase();
    if (value) {
      const tag = tags.find(tag => tag.name.toLowerCase().startsWith(value.toLowerCase()) && !ignoredTags.find(at => at.id === tag.id));
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
<div class="flex">
  <input 
    bind:value={tagSearchInputText} 
    on:keypress={(e) =>  onSubmit(e.key, tagSearchInputText)} 
    on:input={(e) => onTagSearch(e.currentTarget)} 
    class="bg-transparent flex focus:outline-none " 
    type="text" 
  />
  <span class="text-gray-400">{tagSuggestion}</span></div>
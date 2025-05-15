<script lang="ts">
	import type { PopulatedTag } from "$lib/types/PopulatedTag";
	import BlockPromptItem from "./BlockPromptItem.svelte";

  let { tag = $bindable<PopulatedTag>(), onDelete } = $props<{
    tag: PopulatedTag;
    onDelete: () => void;
  }>();
</script>

<BlockPromptItem
  headerText='Tag'
  headerBackgroundColor={tag.color}
  onDelete={onDelete}
>
  <div style={`background-color:${tag.color}`} class="p-1 rounded-b-md rounded-tr-md">
    <span>{tag.name}</span>
  </div>
</BlockPromptItem>
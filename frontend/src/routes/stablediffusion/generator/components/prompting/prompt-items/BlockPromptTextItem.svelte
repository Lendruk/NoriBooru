<script lang="ts">
	import BlockPromptItem from "./BlockPromptItem.svelte";

  let { text = $bindable(), onDelete } = $props<{
    text: string;
    onDelete: () => void;
  }>();
</script>

<BlockPromptItem
  headerText="Text"
  onDelete={onDelete}
>
  <div class="bg-blue-900 p-1 rounded-b-md rounded-tr-md">
    <textarea
      class="focus:outline-none bg-transparent"
      bind:value={text}
    ></textarea>
  </div>
</BlockPromptItem>
<script lang="ts">
	import type { PromptLora } from "$lib/types/SD/SDPromptRequest";
	import { SliderInput } from "@lendruk/personal-svelte-ui-lib";
	import BlockPromptItem from "./BlockPromptItem.svelte";

  let {  promptLora = $bindable(), onDelete }: {
    promptLora: PromptLora;
    onDelete: () => void;
  } = $props();
</script>

<BlockPromptItem
  headerText="Lora"
  onDelete={onDelete}
>
  <div class="bg-blue-900 p-1 rounded-b-md rounded-tr-md">
    {promptLora.lora.name}
    <SliderInput label='' bind:value={promptLora.strength} min={0} max={1} step={0.05} hasNumericInput={true}  />
  </div>
</BlockPromptItem>
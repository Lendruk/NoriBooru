<script lang="ts">
	import type { PromptLora } from '$lib/types/SD/SDPromptRequest';
	import { SliderInput } from '@lendruk/personal-svelte-ui-lib';
	import BlockPromptItem from './BlockPromptItem.svelte';

	let {
		promptLora = $bindable(),
		onDelete
	}: {
		promptLora: PromptLora;
		onDelete: () => void;
	} = $props();

	function isLoraWordActivated(word: string): boolean {
		return !!promptLora.activatedWords?.includes(word);
	}

	function toggleLoraWord(word: string) {
		const index = promptLora.activatedWords?.findIndex((w) => w === word);
		if (index !== -1) {
			promptLora.activatedWords?.splice(index!, 1);
		} else {
			promptLora.activatedWords?.push(word);
		}
	}
</script>

<BlockPromptItem headerText="Lora" {onDelete}>
	<div class="bg-blue-900 p-1 rounded-b-md rounded-tr-md">
		{promptLora.lora.name}
		<SliderInput
			label=""
			bind:value={promptLora.strength}
			min={0}
			max={1}
			step={0.05}
			hasNumericInput={true}
		/>
		<div class="flex overflow-scroll gap-1">
			{#each promptLora.lora.activationWords ?? [] as word}
				<button
					onclick={() => toggleLoraWord(word)}
					class={`border-cyan-600 pl-1 pr-2 border-2 ${isLoraWordActivated(word) ? 'bg-red-950' : 'bg-blue-950'}`}
				>
					{word}
				</button>
			{/each}
		</div>
	</div>
</BlockPromptItem>

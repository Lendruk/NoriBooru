<script lang="ts">
	import type { PopulatedTag } from "$lib/types/PopulatedTag";
	import type { SDLora } from "$lib/types/SD/SDLora";
	import type { PromptBody } from "$lib/types/SD/SDPromptRequest";
	import { LabeledComponent } from "@lendruk/personal-svelte-ui-lib";
	import BlockPrompter from "./BlockPrompter.svelte";

	let { tags, loras, positivePrompt = $bindable(), negativePrompt = $bindable() } = $props<{
		tags: PopulatedTag[];
		loras: SDLora[];
		positivePrompt: PromptBody;
		negativePrompt: PromptBody;
	}>();
</script>

<div>
  <LabeledComponent>
		<div slot="label">Prompt</div>
    <BlockPrompter slot="content" loras={loras} tags={tags} bind:currentPrompt={positivePrompt} />
	</LabeledComponent>
	<LabeledComponent>
		<div slot="label">Negative Prompt</div>
	</LabeledComponent>
</div>

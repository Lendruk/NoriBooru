<script lang="ts">
	import type { PopulatedTag } from '$lib/types/PopulatedTag';
	import type { SDLora } from '$lib/types/SD/SDLora';
	import type { PromptBody } from '$lib/types/SD/SDPromptRequest';
	import type { SDWildcard } from '$lib/types/SD/SDWildcard';
	import { LabeledComponent } from '@lendruk/personal-svelte-ui-lib';
	import BlockPrompter from './BlockPrompter.svelte';

	let {
		tags,
		loras,
		wildcards,
		positivePrompt = $bindable(),
		negativePrompt = $bindable()
	} = $props<{
		wildcards: SDWildcard[];
		tags: PopulatedTag[];
		loras: SDLora[];
		positivePrompt: PromptBody;
		negativePrompt: PromptBody;
	}>();
</script>

<div>
	<LabeledComponent>
		<div slot="label">Prompt</div>
		<BlockPrompter slot="content" {loras} {tags} {wildcards} bind:currentPrompt={positivePrompt} />
	</LabeledComponent>
	<LabeledComponent>
		<div slot="label">Negative Prompt</div>
		<BlockPrompter slot="content" {loras} {tags} {wildcards} bind:currentPrompt={negativePrompt} />
	</LabeledComponent>
</div>

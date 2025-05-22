<script lang="ts">
	import { type PromptBody, type PromptLora } from '$lib/types/SD/SDPromptRequest';
	import { LabeledComponent, TextArea } from '@lendruk/personal-svelte-ui-lib';

	let {
		positivePrompt = $bindable(),
		negativePrompt = $bindable()
	}: {
		positivePrompt: PromptBody;
		negativePrompt: PromptBody;
	} = $props();

	let textualPositivePrompt = $state('');
	let textualNegativePrompt = $state('');
	let selectedPositiveLoras = $state<PromptLora[]>([]);
	let selectedNegativeLoras = $state<PromptLora[]>([]);
</script>

<div class="flex flex-col flex-1">
	<LabeledComponent>
		<div slot="label">Prompt</div>
		<TextArea slot="content" bind:value={textualPositivePrompt} />
	</LabeledComponent>
	<LabeledComponent>
		<div slot="label">Negative Prompt</div>
		<TextArea slot="content" bind:value={textualNegativePrompt} />
	</LabeledComponent>
</div>

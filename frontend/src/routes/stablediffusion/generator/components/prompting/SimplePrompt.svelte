<script lang="ts">
	import { LabeledComponent, TextArea } from '@lendruk/personal-svelte-ui-lib';

	export let positivePrompt: string;
	export let negativePrompt: string;
</script>

<div class="flex flex-col flex-1">
	<LabeledComponent>
		<div slot="label">Prompt</div>
		<TextArea slot="content" bind:value={positivePrompt} />
	</LabeledComponent>
	<LabeledComponent>
		<div slot="label">Negative Prompt</div>
		<TextArea slot="content" bind:value={negativePrompt} />
	</LabeledComponent>
</div>

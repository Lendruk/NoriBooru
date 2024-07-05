<script lang="ts">
	import TextArea from '$lib/components/TextArea.svelte';
	import LabeledComponent from '../../../../components/LabeledComponent.svelte';

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

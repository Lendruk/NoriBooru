<script lang="ts">
	import type { PopulatedTag } from '$lib/types/PopulatedTag';
	import BlockPromptItem from './BlockPromptItem.svelte';

	let {
		tag = $bindable<PopulatedTag>(),
		onDelete
	}: {
		tag: PopulatedTag;
		onDelete: () => void;
	} = $props();
</script>

<BlockPromptItem headerText="Tag" headerBackgroundColor={tag.color} {onDelete}>
	<div style={`background-color:${tag.color}`} class="p-1 rounded-b-md rounded-tr-md">
		<span>{tag.name}</span>
	</div>
</BlockPromptItem>

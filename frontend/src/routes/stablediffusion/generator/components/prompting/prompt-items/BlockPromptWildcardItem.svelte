<script lang="ts">
	import type { PromptWildcard } from '$lib/types/SD/SDPromptRequest';
	import BlockPromptItem from './BlockPromptItem.svelte';

	let {
		promptWildcard = $bindable<PromptWildcard>(),
		onDelete
	}: {
		promptWildcard: PromptWildcard;
		onDelete: () => void;
	} = $props();
</script>

<BlockPromptItem headerText="wildcard" {onDelete}>
	<div class="p-1 rounded-b-md rounded-tr-md bg-blue-900">
		<span>{promptWildcard.wildcard.name}</span>
	</div>
</BlockPromptItem>

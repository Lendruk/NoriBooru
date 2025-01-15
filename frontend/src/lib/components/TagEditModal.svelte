<script lang="ts">
	import type { PopulatedTag } from '$lib/types/PopulatedTag';
	import { Modal } from '@lendruk/personal-svelte-ui-lib';
	import TagSearchInput from './TagSearchInput.svelte';

	export let showModal = false;

	export let appliedTags: PopulatedTag[] = [];
	export let availableTags: PopulatedTag[] = [];
	export let ignoredTags: PopulatedTag[] = [];

	export let onTagSearchSubmit: (tag: PopulatedTag) => void | Promise<void>;
	export let onAppliedTagClick: (tag: PopulatedTag) => void | Promise<void>;
</script>

<Modal class="w-[40%]" bind:showModal>
	<div class="p-4 flex flex-col w-full">
		<div class="text-xl mb-4">Modify media item tags</div>
		<TagSearchInput
			{appliedTags}
			{availableTags}
			ignoredTags={appliedTags}
			{onTagSearchSubmit}
			{onAppliedTagClick}
		/>
	</div>
</Modal>

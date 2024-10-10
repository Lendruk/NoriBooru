<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { endpoints } from '$lib/endpoints';
	import { HttpService } from '$lib/services/HttpService';
	import type { MediaItem } from '$lib/types/MediaItem';
	import type { PopulatedTag } from '$lib/types/PopulatedTag';
	import Modal from './Modal.svelte';
	import TagSearchInput from './TagSearchInput.svelte';

	export let itemsInEdit: Map<number, MediaItem>;
	export let availableTags: PopulatedTag[];
	export let showModal = false;

	let appliedTags: PopulatedTag[] = [];

	async function modifyMediaItemTags() {
		await HttpService.put(
			endpoints.mediaItemTags({ id: JSON.stringify(Array.from(itemsInEdit.keys())) }),
			{
				tags: appliedTags
			}
		);
		showModal = false;
		appliedTags = [];
	}
</script>

<Modal bind:showModal>
	<div class="flex justify-between flex-col w-full p-4">
		<div>
			<div class="mb-4">
				You're adding tags to {itemsInEdit.size} item{itemsInEdit.size > 1 ? 's' : ''}
			</div>
			<TagSearchInput
				{availableTags}
				{appliedTags}
				onAppliedTagClick={(tag) => {
					const index = appliedTags.findIndex((t) => t.id === tag.id);

					if (index !== -1) {
						appliedTags.splice(index, 1);
						appliedTags = appliedTags;
					}
				}}
				onTagSearchSubmit={(tag) => {
					appliedTags.push(tag);
					appliedTags = appliedTags;
				}}
			/>
		</div>
		<Button onClick={modifyMediaItemTags} class="h-[40px]">Confirm</Button>
	</div>
</Modal>

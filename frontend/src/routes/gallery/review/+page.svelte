<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import TagEditModal from '$lib/components/TagEditModal.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import ArchiveIcon from '$lib/icons/ArchiveIcon.svelte';
	import ArrowLeft from '$lib/icons/ArrowLeft.svelte';
	import ArrowRight from '$lib/icons/ArrowRight.svelte';
	import DoorOpen from '$lib/icons/DoorOpen.svelte';
	import InfoIcon from '$lib/icons/InfoIcon.svelte';
	import TagIcon from '$lib/icons/TagIcon.svelte';
	import TrashIcon from '$lib/icons/TrashIcon.svelte';
	import { HttpService } from '$lib/services/HttpService';
	import type { MediaItemWithTags } from '$lib/types/MediaItem';
	import type { PopulatedTag } from '$lib/types/PopulatedTag';
	type ReviewAction = 'Archive' | 'Delete';

	let currentMediaIndex = $state(0);
	let mediaIds = $state<number[]>([]);
	let tags = $state<PopulatedTag[]>([]);
	let fetchedMediaItems = $state<Map<number, MediaItemWithTags>>(new Map());
	let currentMediaItem = $state<MediaItemWithTags | undefined>(undefined);
	let actionMap = $state<Map<number, ReviewAction | undefined>>(new Map());
	let tagsToApply = $state<Map<number, PopulatedTag[]>>(new Map());
	let showConfirmationModal = $state(false);
	let showTagModal = $state(false);
	let hasUnsavedChanges = $state(false);
	let showUnsavedChangesModal = $state(false);

	const inboxUrl = '/gallery?inbox=true';
	$effect(() => {
		HttpService.get<number[]>('/mediaItems/review').then(async (items) => {
			mediaIds = items.reverse();
			const firstItem = await fetchMediaItem(mediaIds[0]);
			currentMediaItem = firstItem;
			fetchedMediaItems.set(firstItem.id, firstItem);
		});

		HttpService.get<PopulatedTag[]>('/tags').then((fetchedTags) => {
			tags = fetchedTags;
		});
	});

	// Listen to action map changes
	$effect(() => {
		hasUnsavedChanges = actionMap.size > 0;
	});

	async function fetchMediaItem(id: number): Promise<MediaItemWithTags> {
		const { mediaItem } = await HttpService.get<{ mediaItem: MediaItemWithTags }>(
			`/mediaItems/${id}`
		);
		return mediaItem;
	}

	async function handleClickLeft() {
		if (currentMediaIndex - 1 >= 0) {
			currentMediaIndex = currentMediaIndex - 1;
			if (!fetchedMediaItems.has(mediaIds[currentMediaIndex])) {
				const newMediaItem = await fetchMediaItem(mediaIds[currentMediaIndex]);
				fetchedMediaItems.set(newMediaItem.id, newMediaItem);
				currentMediaItem = newMediaItem;
			} else {
				currentMediaItem = fetchedMediaItems.get(mediaIds[currentMediaIndex]);
			}
		}
	}

	async function handleClickRight() {
		if (currentMediaIndex + 1 < mediaIds.length) {
			currentMediaIndex = currentMediaIndex + 1;
			if (!fetchedMediaItems.has(mediaIds[currentMediaIndex])) {
				const newMediaItem = await fetchMediaItem(mediaIds[currentMediaIndex]);
				fetchedMediaItems.set(newMediaItem.id, newMediaItem);
				currentMediaItem = newMediaItem;
			} else {
				currentMediaItem = fetchedMediaItems.get(mediaIds[currentMediaIndex]);
			}
		}
	}

	function markItemForArchival(mediaItemId: number) {
		const curAction = actionMap.get(mediaItemId);
		if (curAction === 'Archive') {
			actionMap.delete(mediaItemId);
		} else {
			actionMap.set(mediaItemId, 'Archive');
		}
		actionMap = new Map(actionMap);
	}

	function markItemForDeletion(mediaItemId: number) {
		const curAction = actionMap.get(mediaItemId);
		if (curAction === 'Delete') {
			actionMap.delete(mediaItemId);
		} else {
			actionMap.set(mediaItemId, 'Delete');
		}
		actionMap = new Map(actionMap);
	}

	function onKeyDown(e: KeyboardEvent) {
		if (showTagModal || showConfirmationModal) {
			return;
		}
		switch (e.key) {
			case 'ArrowLeft':
				handleClickLeft();
				break;
			case 'ArrowRight':
				handleClickRight();
				break;
			case ' ':
				markItemForArchival(currentMediaItem!.id);
				break;
			case 'd':
				markItemForDeletion(currentMediaItem!.id);
				break;
			case 'Escape':
				if (showTagModal) {
					showTagModal = false;
				} else if (hasUnsavedChanges) {
					showUnsavedChangesModal = true;
				} else {
					goto(inboxUrl);
				}
				break;
		}
	}

	async function onReviewFinishConfirmation() {
		let itemsToArchive: number[] = [];
		let itemsToDelete: number[] = [];

		for (const pair of actionMap) {
			if (pair[1] === 'Archive') {
				itemsToArchive.push(pair[0]);
			} else {
				itemsToDelete.push(pair[0]);
			}
		}

		let promises: Promise<unknown>[] = [];
		if (itemsToArchive.length > 0) {
			promises.push(
				HttpService.patch(`/mediaItems/${JSON.stringify(itemsToArchive)}`, { isArchived: true })
			);
		}

		if (itemsToDelete.length > 0) {
			promises.push(HttpService.delete(`/mediaItems/${JSON.stringify(itemsToDelete)}`));
		}

		if (tagsToApply.size > 0) {
			for (const pair of tagsToApply) {
				const id = pair[0];
				const tags = pair[1];
				promises.push(HttpService.put(`/mediaItems/${JSON.stringify([id])}/tags`, { tags }));
			}
		}

		await Promise.all(promises);

		goto(inboxUrl);
	}

	function addTagToMediaItem(tag: PopulatedTag) {
		if (currentMediaItem) {
			if (tagsToApply.has(currentMediaItem.id)) {
				const curTags = tagsToApply.get(currentMediaItem.id)!;
				curTags.push(tag);
				tagsToApply.set(currentMediaItem.id, curTags);
			} else {
				tagsToApply.set(currentMediaItem.id, [tag]);
			}
			tagsToApply = new Map(tagsToApply);
		}
	}

	function removeTagFromMediaItem(tag: PopulatedTag) {
		if (currentMediaItem) {
			const tags = tagsToApply.get(currentMediaItem.id);
			if (tags) {
				const index = tags.findIndex((t) => t.id === tag.id);
				tags.splice(index, 1);
				tagsToApply.set(currentMediaItem.id, tags);
				tagsToApply = new Map(tagsToApply);
			}
		}
	}
</script>

<div class="absolute right-10 top-5 z-[50]">
	{currentMediaIndex + 1} / {mediaIds.length}
</div>
<div
	class="absolute right-10 bottom-5 z-[50] bg-zinc-900 p-3 rounded-md hover:bg-red-800 hover:transition"
>
	<button
		on:click={() => {
			if (actionMap.size > 0) {
				showConfirmationModal = true;
			} else {
				goto(inboxUrl);
			}
		}}><DoorOpen width={32} height={32} /></button
	>
</div>
<div class="flex flex-row flex-1 h-full absolute top-0 left-0 w-full z-[40]">
	<button
		on:click={handleClickLeft}
		class={`flex fill-white justify-center items-center w-1/12 bg-red-950 hover:bg-red-900 hover:transition ${currentMediaIndex - 1 < 0 && 'cursor-not-allowed'}`}
	>
		<ArrowLeft />
	</button>
	{#if currentMediaItem}
		<div
			class="flex flex-1 flex-col justify-center items-center bg-zinc-800 backdrop-blur-lg bg-opacity-5 relative"
		>
			{#if currentMediaItem.type === 'image'}
				<img
					class="max-w-full max-h-[85vh]"
					src={`${HttpService.BASE_URL}/images/${HttpService.getVaultId()}/${currentMediaItem.fileName}.${currentMediaItem.extension}`}
					alt="gallery-img"
				/>
			{/if}
			{#if currentMediaItem.type === 'video'}
				<video
					class="bg-cover w-full h-full"
					src={`${HttpService.BASE_URL}/videos/${HttpService.getVaultId()}/${currentMediaItem.fileName}.${currentMediaItem.extension}`}
					controls
				>
					<track kind="captions" />
				</video>
			{/if}

			<Tooltip>
				<div slot="target" class="absolute top-4 right-4">
					<InfoIcon />
				</div>
				<div class="flex flex-1 flex-col w-[300px]" slot="toolTipContent">
					<div>D - mark for current item for deletion</div>
					<div>Spacebar - mark current item for archival</div>
					<div>Escape - exit review mode</div>
				</div>
			</Tooltip>

			<div class="fill-white flex gap-4 mt-10">
				<button
					on:click={() => markItemForArchival(currentMediaItem!.id)}
					class={`${actionMap.get(currentMediaItem!.id) === 'Archive' ? 'bg-red-950' : 'bg-red-900'} hover:bg-red-800 hover:transition rounded-full p-4`}
				>
					<ArchiveIcon width={32} height={32} />
				</button>
				<button
					on:click={() => markItemForDeletion(currentMediaItem!.id)}
					class={`${actionMap.get(currentMediaItem!.id) === 'Delete' ? 'bg-red-950' : 'bg-red-900'} hover:bg-red-800 hover:transition rounded-full p-4`}
				>
					<TrashIcon width={32} height={32} />
				</button>
				<button
					on:click={() => (showTagModal = true)}
					class="bg-red-900 rounded-full p-4 hover:bg-red-800 hover:transition"
				>
					<TagIcon width={32} height={32} />
				</button>
			</div>
		</div>
	{/if}
	<button
		on:click={handleClickRight}
		class={`flex justify-center bg-red-950 hover:bg-red-900 hover:transition fill-white items-center w-1/12 ${currentMediaIndex + 1 >= mediaIds.length && 'cursor-not-allowed'}`}
	>
		<ArrowRight />
	</button>
</div>

<Modal bind:showModal={showConfirmationModal}>
	<div class="flex flex-1 flex-col m-4 gap-4">
		<div>Finish Review</div>
		<div>
			You will be archiving / deleting {actionMap.size} item{actionMap.size > 1 ? 's' : ''}
		</div>
		<Button class="bg-red-950 hover:bg-red-800 h-[40px]" onClick={onReviewFinishConfirmation}
			>Confirm</Button
		>
	</div>
</Modal>

<Modal bind:showModal={showUnsavedChangesModal}>
	<div class="flex flex-1 flex-col m-4 gap-4">
		<div>Unsaved Changes</div>
		<div>You have unsaved changes, are you sure you want to leave?</div>
		<Button
			onClick={() => {
				goto(inboxUrl);
			}}>Yes</Button
		>
		<Button onClick={() => (showUnsavedChangesModal = false)}>No</Button>
	</div>
</Modal>

{#if currentMediaItem}
	<TagEditModal
		bind:showModal={showTagModal}
		availableTags={tags}
		appliedTags={currentMediaItem?.tags.concat(tagsToApply.get(currentMediaItem.id) ?? [])}
		ignoredTags={currentMediaItem?.tags.concat(tagsToApply.get(currentMediaItem.id) ?? [])}
		onAppliedTagClick={removeTagFromMediaItem}
		onTagSearchSubmit={addTagToMediaItem}
	/>
{/if}

<svelte:window on:keydown={onKeyDown} />

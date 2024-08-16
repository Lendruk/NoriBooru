<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import LabeledComponent from '$lib/components/LabeledComponent.svelte';
	import Link from '$lib/components/Link.svelte';
	import MassTagEditModal from '$lib/components/MassTagEditModal.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Select from '$lib/components/Select.svelte';
	import TagSearchInput from '$lib/components/TagSearchInput.svelte';
	import Video from '$lib/components/Video.svelte';
	import ArchiveIcon from '$lib/icons/ArchiveIcon.svelte';
	import CheckIcon from '$lib/icons/CheckIcon.svelte';
	import FilterIcon from '$lib/icons/FilterIcon.svelte';
	import InboxIcon from '$lib/icons/InboxIcon.svelte';
	import TagIcon from '$lib/icons/TagIcon.svelte';
	import TrashIcon from '$lib/icons/TrashIcon.svelte';
	import XIcon from '$lib/icons/XIcon.svelte';
	import { HttpService } from '$lib/services/HttpService';
	import type { MediaItem, MediaItemMetadata } from '$lib/types/MediaItem';
	import type { PopulatedTag } from '$lib/types/PopulatedTag';
	import { pause } from '$lib/utils/time';
	import { onMount } from 'svelte';
	import GalleryItem from './GalleryItem.svelte';

	type SortMethod = 'newest' | 'oldest';
	type MediaType = 'ALL' | 'IMAGES' | 'VIDEOS';
	type CombinationalLogicType = 'AND' | 'OR';

	let mediaItems: MediaItem[] = [];
	let appliedPositiveTags: PopulatedTag[] = [];
	let positiveQueryType: 'AND' | 'OR' = 'AND';
	let appliedNegativeTags: PopulatedTag[] = [];
	let negativeQueryType: 'AND' | 'OR' = 'AND';
	let tags: PopulatedTag[] = [];
	let sortMethod: SortMethod = 'newest';
	let mediaType: 'ALL' | 'VIDEOS' | 'IMAGES' = 'ALL';
	let showMediaTagEditModal = false;
	let showMassTagEditModal = false;
	let currentPage = 0;
	let hasMoreItems = true;
	let fetchingItems = false;
	let isFilterSelectionVisible = false;
	let mediaItemInTagEdit: { id: number; tags: PopulatedTag[] } | undefined;

	let searchParams: URLSearchParams = new URLSearchParams();
	let galleryDiv: HTMLDivElement;

	let selectedItems: Map<number, MediaItem> = new Map();
	let isSelectionModeActive = false;
	let isInbox = false;

	$: isSelectionModeActive = selectedItems.size > 0;
	$: isInbox = $page.url.searchParams.has('inbox');

	onMount(async () => {
		searchParams = $page.url.searchParams;
		currentPage = 0;
		hasMoreItems = true;
		if (searchParams.size > 0) {
			isInbox = searchParams.has('inbox');
			sortMethod = (searchParams.get('sortMethod') as SortMethod) ?? 'newest';
			mediaType = (searchParams.get('mediaType') as MediaType) ?? 'ALL';
			positiveQueryType =
				(searchParams.get('positiveQueryType') as CombinationalLogicType) ?? 'AND';
			negativeQueryType =
				(searchParams.get('negativeQueryType') as CombinationalLogicType) ?? 'AND';
			appliedPositiveTags = searchParams.has('positiveTags')
				? JSON.parse(searchParams.get('positiveTags')!)
				: [];
			appliedNegativeTags = searchParams.has('negativeTags')
				? JSON.parse(searchParams.get('negativeTags')!)
				: [];
		}
		page.subscribe(async (val) => {
			if (val.url.searchParams.has('inbox')) {
				isInbox = true;
			} else {
				isInbox = false;
			}

			selectedItems = new Map();
			currentPage = 0;
			mediaItems = [];
			await populateScreen();
		});
		tags = await HttpService.get<PopulatedTag[]>('/tags');
	});

	async function populateScreen() {
		await search(true);
		currentPage = currentPage + 1;
		while (galleryDiv.scrollHeight <= window.innerHeight) {
			const res = await search(true);
			currentPage = currentPage + 1;
			if (res.length === 0) {
				break;
			}
		}
	}

	async function applyPositiveTagFilter(tag: PopulatedTag) {
		appliedPositiveTags = [...appliedPositiveTags, tag];
		currentPage = 0;
		hasMoreItems = true;
		searchParams.set('positiveTags', JSON.stringify(appliedPositiveTags));
		goto(`?${searchParams.toString()}`);
	}

	async function applyNegativeTagFilter(tag: PopulatedTag) {
		appliedNegativeTags = [...appliedNegativeTags, tag];
		currentPage = 0;
		hasMoreItems = true;
		searchParams.set('negativeTags', JSON.stringify(appliedNegativeTags));
		goto(`?${searchParams.toString()}`);
	}

	async function removeTagFromMediaItem(tag: PopulatedTag, mediaItemId: number) {
		await HttpService.delete(`/mediaItems/${mediaItemId}/tags`, { ...tag });
		const tagIndex = mediaItemInTagEdit!.tags.findIndex((mediaTag) => mediaTag.id === tag.id);
		mediaItemInTagEdit!.tags.splice(tagIndex, 1);
		mediaItemInTagEdit!.tags = mediaItemInTagEdit!.tags;
	}

	async function addTagToMediaItem(tag: PopulatedTag, mediaItemId: number) {
		await HttpService.put(`/mediaItems/${JSON.stringify([mediaItemId])}/tags`, { ...tag });
		mediaItemInTagEdit!.tags.push(tag);
		mediaItemInTagEdit!.tags = mediaItemInTagEdit!.tags;
	}

	async function cleanSearch(appendResults = false): Promise<MediaItem[]> {
		currentPage = 0;
		hasMoreItems = true;
		return await search(appendResults);
	}

	async function search(appendResults: boolean = false): Promise<MediaItem[]> {
		fetchingItems = true;
		const res = await HttpService.get<{ mediaItems: MediaItem[] }>(
			'/mediaItems?' +
				new URLSearchParams({
					negativeTags: JSON.stringify(appliedNegativeTags.map((tag) => tag.id)),
					positiveTags: JSON.stringify(appliedPositiveTags.map((tag) => tag.id)),
					positiveQueryType,
					negativeQueryType,
					mediaType,
					sortMethod,
					archived: isInbox ? 'false' : 'true',
					page: currentPage.toString()
				})
		);

		if (appendResults) {
			if (res.mediaItems.length > 0) {
				mediaItems = mediaItems.concat(res.mediaItems);
			} else {
				hasMoreItems = false;
			}
		} else {
			mediaItems = res.mediaItems;
		}
		await pause(1000);
		fetchingItems = false;
		return res.mediaItems;
	}

	async function removePositiveTagFilter(tag: PopulatedTag) {
		appliedPositiveTags = appliedPositiveTags.filter((t) => t.id !== tag.id);
		currentPage = 0;
		hasMoreItems = true;
		await search();
	}

	async function removeNegativeTagFilter(tag: PopulatedTag) {
		appliedNegativeTags = appliedNegativeTags.filter((t) => t.id !== tag.id);
		currentPage = 0;
		hasMoreItems = true;
		await search();
	}

	async function deleteItems(mediaItemIds: number[]) {
		await HttpService.delete(`/mediaItems/${JSON.stringify(mediaItemIds)}`);
		mediaItems = mediaItems.filter((item) => !mediaItemIds.includes(item.id));
	}

	async function deleteSelectedItems() {
		let itemIds: number[] = [];
		for (const id of selectedItems.keys()) {
			itemIds.push(id);
		}
		await deleteItems(itemIds);
		selectedItems = new Map();
	}

	async function toggleArchivedStatus(mediaItemIds: number[], isArchived: boolean) {
		await HttpService.patch(`/mediaItems/${JSON.stringify(mediaItemIds)}`, { isArchived });
		mediaItems = mediaItems.map((item) =>
			mediaItemIds.includes(item.id) ? { ...item, isArchived } : item
		);
	}

	async function toggleSelectedItems() {
		let itemIds: number[] = [];
		for (const id of selectedItems.keys()) {
			itemIds.push(id);
		}
		await toggleArchivedStatus(itemIds, isInbox ? true : false);
		selectedItems = new Map();
		await search();
	}

	async function fetchMediaItemTags(mediaItemId: number) {
		const tags = await HttpService.get<PopulatedTag[]>(`/mediaItems/${mediaItemId}/tags`);
		mediaItemInTagEdit = { id: mediaItemId, tags };
	}

	function onPositiveTagSearchSubmit(tag: PopulatedTag) {
		applyPositiveTagFilter(tag);
	}

	function onNegativeTagSearchSubmit(tag: PopulatedTag) {
		applyNegativeTagFilter(tag);
	}

	async function onTagButtonClick(mediaItemId: number) {
		await fetchMediaItemTags(mediaItemId);
		showMediaTagEditModal = !showMediaTagEditModal;
	}

	function onMediaItemSelect(mediaItem: MediaItem) {
		if (selectedItems.has(mediaItem.id)) {
			selectedItems.delete(mediaItem.id);
		} else {
			selectedItems.set(mediaItem.id, mediaItem);
		}
		selectedItems = selectedItems;
	}

	function onKeyPress(event: KeyboardEvent) {
		if (!showMassTagEditModal && !showMediaTagEditModal) {
			if (event.key === 'f' || event.key === 'F') {
				isFilterSelectionVisible = !isFilterSelectionVisible;
			}
		}
	}

	async function onWindowScroll(
		e: UIEvent & {
			currentTarget: EventTarget & Window;
		}
	) {
		if (
			e.currentTarget.scrollY + e.currentTarget.innerHeight >=
			document.documentElement.scrollHeight - 50
		) {
			if (hasMoreItems && !fetchingItems) {
				currentPage = currentPage + 1;
				await search(true);
			}
		}
	}

	function goToGenerator(metadata?: MediaItemMetadata) {
		goto(
			`/stablediffusion/generator?inputMetadata=${encodeURIComponent(JSON.stringify(metadata ?? {}))}`
		);
	}
</script>

<div class="relative">
	{#if mediaItems.length > 0}
		<div class="flex flex-1 mr-2 justify-between min-h-[60px] sticky top-10 z-[10]">
			{#if isSelectionModeActive}
				<div class="flex ml-2 mt-2 mb-2 p-2 bg-zinc-900 rounded-lg items-center fill-white">
					<div class="flex gap-8">
						<div class="flex gap-4">
							<span class="flex items-center gap-4"
								><CheckIcon /> Selecting {selectedItems.size} Items</span
							>
							<button
								class="flex items-center gap-4 hover:text-red-950 hover:fill-red-950 hover:transition"
								on:click={() => (selectedItems = new Map())}><XIcon />Deselect all</button
							>
						</div>

						<div class="flex gap-2 items-center">
							<button
								on:click={() => deleteSelectedItems()}
								class="bg-red-900 rounded-sm w-[25px] h-[25px] flex items-center justify-center hover:bg-red-950 hover:transition"
							>
								<TrashIcon />
							</button>
							<button
								on:click={() => toggleSelectedItems()}
								class="bg-red-900 rounded-sm w-[25px] h-[25px] flex items-center justify-center hover:bg-red-950 hover:transition"
							>
								{#if isInbox}
									<ArchiveIcon />
								{:else}
									<InboxIcon />
								{/if}
							</button>
							<button
								on:click={() => (showMassTagEditModal = true)}
								class="bg-red-900 rounded-sm w-[25px] h-[25px] flex items-center justify-center hover:bg-red-950 hover:transition"
							>
								<TagIcon />
							</button>
						</div>
					</div>
				</div>
			{/if}
			<div class="flex w-fit p-2 mt-2 mb-2 self-end bg-zinc-900 rounded-lg">
				<button
					class={`${isFilterSelectionVisible ? 'fill-red-900' : 'fill-white'}`}
					on:click={() => (isFilterSelectionVisible = !isFilterSelectionVisible)}
				>
					<FilterIcon />
				</button>

				{#if isInbox}
					<Link
						href={mediaItems.length > 0 ? '/gallery/review' : ''}
						class={`${mediaItems.length > 0 ? 'cursor-pointer' : 'cursor-not-allowed'} ml-2`}
						>Start review</Link
					>
				{/if}
			</div>
		</div>
	{/if}
	<div class="flex flex-1 h-full relative">
		{#if isFilterSelectionVisible}
			<div class="bg-zinc-900 rounded-lg p-2 ml-2 flex flex-col w-[40%]">
				<div class="text-3xl mb-4 sticky">Filters</div>
				<div class="flex flex-col mb-2">
					<div class="mb-2 flex justify-between">
						<div>Positive Tags</div>
						<div class="flex flex-1 max-w-[150px]">
							<button
								class={`${positiveQueryType === 'AND' ? 'bg-red-900' : 'bg-surface-color hover:bg-zinc-800 hover:transition'} w-1/2 rounded-tl-md rounded-bl-md`}
								on:click={() => {
									positiveQueryType = 'AND';
									searchParams.set('positiveQueryType', positiveQueryType);
									goto(`?${searchParams.toString()}`);
								}}>AND</button
							>
							<button
								class={`${positiveQueryType === 'OR' ? 'bg-red-900' : 'bg-surface-color hover:bg-zinc-800 hover:transition'}  w-1/2 rounded-tr-md rounded-br-md`}
								on:click={() => {
									positiveQueryType = 'OR';
									searchParams.set('positiveQueryType', positiveQueryType);
									goto(`?${searchParams.toString()}`);
								}}>OR</button
							>
						</div>
					</div>
					<TagSearchInput
						availableTags={tags}
						appliedTags={appliedPositiveTags}
						class="outline-none min-h-[40px] indent-2"
						ignoredTags={appliedPositiveTags.concat(appliedNegativeTags)}
						onTagSearchSubmit={onPositiveTagSearchSubmit}
						onAppliedTagClick={removePositiveTagFilter}
					/>
				</div>
				<div class="flex flex-col">
					<div class="mb-2 flex justify-between">
						<div>Negative Tags</div>
						<div class="flex flex-1 max-w-[150px]">
							<button
								class={`${negativeQueryType === 'AND' ? 'bg-red-900' : 'bg-surface-color hover:bg-zinc-800 hover:transition'} w-1/2 rounded-tl-md rounded-bl-md`}
								on:click={() => {
									negativeQueryType = 'AND';
									searchParams.set('negativeQueryType', negativeQueryType);
									goto(`?${searchParams.toString()}`);
								}}>AND</button
							>
							<button
								class={`${negativeQueryType === 'OR' ? 'bg-red-900' : 'bg-surface-color hover:bg-zinc-800 hover:transition'}  w-1/2 rounded-tr-md rounded-br-md`}
								on:click={() => {
									negativeQueryType = 'OR';
									searchParams.set('negativeQueryType', negativeQueryType);
									goto(`?${searchParams.toString()}`);
								}}>OR</button
							>
						</div>
					</div>
					<TagSearchInput
						availableTags={tags}
						appliedTags={appliedNegativeTags}
						class="outline-none min-h-[40px] indent-2"
						ignoredTags={appliedPositiveTags.concat(appliedNegativeTags)}
						onTagSearchSubmit={onNegativeTagSearchSubmit}
						onAppliedTagClick={removeNegativeTagFilter}
					/>
				</div>
				<div>
					Sort by:
					<select
						bind:value={sortMethod}
						on:change={() => {
							searchParams.set('sortMethod', sortMethod);
							goto(`?${searchParams.toString()}`);
						}}
						class="text-black"
					>
						<option value="newest">Newest</option>
						<option value="oldest">Oldest</option>
					</select>
				</div>
				<LabeledComponent>
					<div slot="label">Media Type</div>
					<Select
						bind:value={mediaType}
						on:change={() => {
							// TODO: Figure out why i need the timeout here
							setTimeout(() => {
								searchParams.set('mediaType', mediaType);
								goto(`?${searchParams.toString()}`);
							}, 10);
						}}
						class="h-[40px]"
						slot="content"
					>
						<option value="ALL">All</option>
						<option value="IMAGES">Images</option>
						<option value="VIDEOS">Videos</option>
					</Select>
				</LabeledComponent>
			</div>
		{/if}
		<div
			bind:this={galleryDiv}
			class="grid w-full gap-2 justify-center"
			style={`grid-template-columns: repeat(auto-fit, minmax(208px, 1fr));`}
		>
			{#each mediaItems as mediaItem}
				<GalleryItem
					isAiGen={!!mediaItem.metadata?.model}
					isArchived={mediaItem.isArchived}
					onMoveToArchive={() => toggleArchivedStatus([mediaItem.id], !mediaItem.isArchived)}
					onMoveToInbox={() => toggleArchivedStatus([mediaItem.id], !mediaItem.isArchived)}
					onConfirmDelete={() => deleteItems([mediaItem.id])}
					onTagButtonClick={() => onTagButtonClick(mediaItem.id)}
					onSelectClick={() => onMediaItemSelect(mediaItem)}
					onGotoGeneratorClick={() => goToGenerator(mediaItem.metadata)}
					isSelected={selectedItems.has(mediaItem.id)}
					{isSelectionModeActive}
					href={`/gallery/${mediaItem.id}${searchParams.size > 0 ? `?${searchParams.toString()}` : ''}`}
				>
					{#if mediaItem.type === 'image'}
						<img
							class="h-full"
							src={`${HttpService.BASE_URL}/images/${HttpService.getVaultId()}/thumb/${mediaItem.fileName}.jpg`}
							alt="gallery-img"
						/>
					{/if}
					{#if mediaItem.type === 'video'}
						<Video
							cssClass="bg-cover w-full h-full"
							src={`${HttpService.BASE_URL}/videos/${HttpService.getVaultId()}/thumb/${mediaItem.fileName}.mp4`}
						/>
					{/if}
				</GalleryItem>
			{/each}
			{#if mediaItems.length === 0}
				<div
					class="text-4xl bg-zinc-900 p-4 rounded-md flex justify-center h-full items-center self-center"
				>
					No items in {isInbox ? 'inbox' : 'gallery'}
				</div>
			{/if}
		</div>
	</div>
</div>
<Modal class="w-[40%]" bind:showModal={showMediaTagEditModal}>
	<div class="p-4 flex flex-col w-full">
		<div class="text-xl mb-4">Modify media item tags</div>
		{#if mediaItemInTagEdit}
			<TagSearchInput
				appliedTags={mediaItemInTagEdit.tags}
				availableTags={tags}
				ignoredTags={mediaItemInTagEdit.tags}
				onAppliedTagClick={(tag) => removeTagFromMediaItem(tag, mediaItemInTagEdit!.id)}
				onTagSearchSubmit={(tag) => addTagToMediaItem(tag, mediaItemInTagEdit!.id)}
			/>
		{/if}
	</div>
</Modal>
<MassTagEditModal
	showModal={showMassTagEditModal}
	itemsInEdit={selectedItems}
	availableTags={tags}
/>

<svelte:window on:scroll={onWindowScroll} on:keypress={onKeyPress} />

<svelte:head>
	<title>NoriBooru - Gallery</title>
</svelte:head>

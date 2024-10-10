<script context="module" lang="ts">
	export type SortMethod = 'newest' | 'oldest';
	export type MediaType = 'ALL' | 'IMAGES' | 'VIDEOS';
	export type CombinationalLogicType = 'AND' | 'OR';
	export type MediaTypes = 'ALL' | 'IMAGES' | 'VIDEOS';

	export type GalleryQuery = {
		positiveTags: PopulatedTag[];
		negativeTags: PopulatedTag[];
		sortMethod: SortMethod;
		page: number;
		inbox: boolean;
		positiveQueryType: CombinationalLogicType;
		negativeQueryType: CombinationalLogicType;
		mediaType: MediaTypes;
	};
</script>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Button from '$lib/components/Button.svelte';
	import LabeledComponent from '$lib/components/LabeledComponent.svelte';
	import Link from '$lib/components/Link.svelte';
	import MassTagEditModal from '$lib/components/MassTagEditModal.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Select from '$lib/components/Select.svelte';
	import TagSearchInput from '$lib/components/TagSearchInput.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { createToast } from '$lib/components/toast/ToastContainer.svelte';
	import Video from '$lib/components/Video.svelte';
	import { endpoints } from '$lib/endpoints';
	import ArchiveIcon from '$lib/icons/ArchiveIcon.svelte';
	import CheckIcon from '$lib/icons/CheckIcon.svelte';
	import FilterIcon from '$lib/icons/FilterIcon.svelte';
	import InboxIcon from '$lib/icons/InboxIcon.svelte';
	import TagIcon from '$lib/icons/TagIcon.svelte';
	import TrashIcon from '$lib/icons/TrashIcon.svelte';
	import XIcon from '$lib/icons/XIcon.svelte';
	import { HttpService } from '$lib/services/HttpService';
	import type { MediaItem, MediaItemMetadata } from '$lib/types/MediaItem';
	import type { Playlist } from '$lib/types/Playlist';
	import type { PopulatedTag } from '$lib/types/PopulatedTag';
	import { onMount } from 'svelte';
	import GalleryItem from './GalleryItem.svelte';

	export let showReviewButton = true;
	export let showFilterButton = true;
	export let isInbox: boolean | undefined = undefined;
	export let usesQueryParams: boolean;
	export let watcherId: string | undefined = undefined;
	export let appliedPositiveTags: PopulatedTag[] = [];
	export let positiveQueryType: CombinationalLogicType = 'AND';
	export let appliedNegativeTags: PopulatedTag[] = [];
	export let negativeQueryType: CombinationalLogicType = 'AND';
	export let sortMethod: SortMethod = 'newest';
	export let mediaType: MediaTypes = 'ALL';
	export let showMediaTagEditModal = false;
	export let showMassTagEditModal = false;
	export let currentPage = 0;
	export let hasMoreItems = true;
	export let fetchingItems = false;
	export let isFilterSelectionVisible = false;

	// Playlist modal
	let isPlaylistModalOpen = false;
	let playlists: Playlist[] = [];
	let mediaItemToAddToPlaylist: MediaItem | undefined = undefined;
	let isPlaylistCreationModalOpen = false;
	let playlistCreationName = '';

	let pageSize = 50;

	export const refreshGallery = async () => {
		currentPage = 0;
		await search({ appendResults: false, watcherId });
	};

	let mediaItemInTagEdit: { id: number; tags: PopulatedTag[] } | undefined;
	let searchParams: URLSearchParams = new URLSearchParams();
	let tags: PopulatedTag[] = [];
	let mediaItems: MediaItem[] = [];
	let galleryDiv: HTMLDivElement;

	let selectedItems: Map<number, MediaItem> = new Map();
	let isSelectionModeActive = false;
	let scrollLocked = false;

	$: isSelectionModeActive = selectedItems.size > 0;

	$: {
		if (usesQueryParams) {
		} else {
			currentPage = 0;
			search({ appendResults: false, watcherId });
		}
	}

	function updateSearchParams(key: string, value: string) {
		if (usesQueryParams) {
			searchParams.set(key, value);
			goto(`?${searchParams.toString()}`);
		}
	}

	onMount(async () => {
		currentPage = 0;
		hasMoreItems = true;

		if (usesQueryParams) {
			searchParams = $page.url.searchParams;
			if (searchParams.size > 0) {
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
				selectedItems = new Map();
				currentPage = 0;
				mediaItems = [];
				await populateScreen();
			});
		}
		tags = await HttpService.get<PopulatedTag[]>(endpoints.getTags());
	});

	async function createPlaylist() {
		const newPlaylist = await HttpService.post<Playlist>(endpoints.playlists(), {
			name: playlistCreationName,
			randomizeOrder: false,
			timePerItem: 0,
			items: [mediaItemToAddToPlaylist!.id]
		});

		playlists = [...playlists, newPlaylist];
		playlistCreationName = '';
		isPlaylistCreationModalOpen = false;
		createToast('Playlist created successfully');
	}

	async function populateScreen() {
		await search({ appendResults: true, watcherId });
		currentPage = currentPage + 1;
		while (galleryDiv.scrollHeight <= window.innerHeight) {
			const res = await search({ appendResults: true, watcherId });
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
		updateSearchParams('positiveTags', JSON.stringify(appliedPositiveTags));
	}

	async function applyNegativeTagFilter(tag: PopulatedTag) {
		appliedNegativeTags = [...appliedNegativeTags, tag];
		currentPage = 0;
		hasMoreItems = true;
		updateSearchParams('negativeTags', JSON.stringify(appliedNegativeTags));
	}

	async function removeTagFromMediaItem(tag: PopulatedTag, mediaItemId: number) {
		await HttpService.delete(endpoints.mediaItemTags({ id: mediaItemId }), { ...tag });
		const tagIndex = mediaItemInTagEdit!.tags.findIndex((mediaTag) => mediaTag.id === tag.id);
		mediaItemInTagEdit!.tags.splice(tagIndex, 1);
		mediaItemInTagEdit!.tags = mediaItemInTagEdit!.tags;
	}

	async function addTagToMediaItem(tag: PopulatedTag, mediaItemId: number) {
		await HttpService.put(`/media-items/${JSON.stringify([mediaItemId])}/tags`, { ...tag });
		mediaItemInTagEdit!.tags.push(tag);
		mediaItemInTagEdit!.tags = mediaItemInTagEdit!.tags;
	}

	async function search(options: {
		appendResults: boolean;
		watcherId?: string;
	}): Promise<MediaItem[]> {
		fetchingItems = true;
		const { appendResults, watcherId } = options;

		const params = new URLSearchParams({
			negativeTags: JSON.stringify(appliedNegativeTags.map((tag) => tag.id)),
			positiveTags: JSON.stringify(appliedPositiveTags.map((tag) => tag.id)),
			positiveQueryType,
			negativeQueryType,
			mediaType,
			sortMethod,
			pageSize: pageSize.toString(),
			page: currentPage.toString(),
			watcherId: watcherId ?? ''
		});
		if (isInbox !== undefined) {
			params.set('archived', isInbox ? 'false' : 'true');
		}
		const res = await HttpService.get<MediaItem[]>(endpoints.getMediaItems({ params }));
		let fetchedMediaItems = res;
		if (appendResults) {
			if (res.length > 0) {
				mediaItems = mediaItems.concat(res);
			} else {
				hasMoreItems = false;
			}
		} else {
			mediaItems = fetchedMediaItems;
		}

		// Pro-actively fetch more items if we have reached the end of the current page
		if (fetchedMediaItems.length === pageSize) {
			currentPage = currentPage + 1;
			fetchedMediaItems = await search({ appendResults: true, watcherId });

			if (fetchedMediaItems.length === 0) {
				hasMoreItems = false;
			}
		}

		fetchingItems = false;
		return fetchedMediaItems;
	}

	async function removePositiveTagFilter(tag: PopulatedTag) {
		appliedPositiveTags = appliedPositiveTags.filter((t) => t.id !== tag.id);
		updateSearchParams('positiveTags', JSON.stringify(appliedPositiveTags));
		currentPage = 0;
		hasMoreItems = true;
	}

	async function removeNegativeTagFilter(tag: PopulatedTag) {
		appliedNegativeTags = appliedNegativeTags.filter((t) => t.id !== tag.id);
		updateSearchParams('negativeTags', JSON.stringify(appliedPositiveTags));
		currentPage = 0;
		hasMoreItems = true;
	}

	async function deleteItems(mediaItemIds: number[]) {
		await HttpService.delete(endpoints.mediaItem({ id: JSON.stringify(mediaItemIds) }));
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
		await HttpService.patch(endpoints.mediaItem({ id: JSON.stringify(mediaItemIds) }), {
			isArchived
		});
		mediaItems = mediaItems.map((item) =>
			mediaItemIds.includes(item.id) ? { ...item, isArchived } : item
		);
	}

	async function toggleSelectedItems(archived: boolean) {
		let itemIds: number[] = [];
		for (const id of selectedItems.keys()) {
			itemIds.push(id);
		}
		await toggleArchivedStatus(itemIds, archived);
		selectedItems = new Map();
		await search({ appendResults: false, watcherId });
	}

	async function fetchMediaItemTags(mediaItemId: number) {
		const tags = await HttpService.get<PopulatedTag[]>(
			endpoints.mediaItemTags({ id: mediaItemId })
		);
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

	async function onGalleryScroll(
		e: UIEvent & {
			currentTarget: HTMLDivElement;
		}
	) {
		if (scrollLocked) return;
		scrollLocked = true;
		if (
			e.currentTarget.scrollHeight - e.currentTarget.scrollTop - e.currentTarget.clientHeight <=
			200
		) {
			if (hasMoreItems && !fetchingItems) {
				currentPage = currentPage + 1;
				await search({ appendResults: true, watcherId });
			}
		}
		scrollLocked = false;
	}

	function goToGenerator(metadata?: MediaItemMetadata) {
		goto(
			`/stablediffusion/generator?inputMetadata=${encodeURIComponent(JSON.stringify(metadata ?? {}))}`
		);
	}

	async function onAddToPlaylistClick(mediaItem: MediaItem) {
		playlists = await HttpService.get<Playlist[]>(endpoints.playlists());
		mediaItemToAddToPlaylist = mediaItem;
		isPlaylistModalOpen = true;
	}

	async function addMediaItemToPlaylist(playlistId: number, mediaItemId: number) {
		await HttpService.patch(endpoints.addPlaylistItem({ id: playlistId }), { item: mediaItemId });
		playlists = playlists.map((playlist) => {
			if (playlist.id === playlistId) {
				playlist.items.push(mediaItemId);
			}
			return playlist;
		});
		createToast('Media item added successfully');
	}
</script>

<div class={`relative flex flex-1 flex-col max-h-full overflow-scroll`} on:scroll={onGalleryScroll}>
	{#if mediaItems.length > 0 && (isSelectionModeActive || showFilterButton || showReviewButton)}
		<div class="flex flex-1 mr-2 justify-between min-h-[60px] sticky z-[10]">
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
							{#if isInbox || isInbox === undefined}
								<button
									on:click={() => toggleSelectedItems(true)}
									class="bg-red-900 rounded-sm w-[25px] h-[25px] flex items-center justify-center hover:bg-red-950 hover:transition"
								>
									<ArchiveIcon />
								</button>
							{/if}
							{#if !isInbox}
								<button
									on:click={() => toggleSelectedItems(false)}
									class="bg-red-900 rounded-sm w-[25px] h-[25px] flex items-center justify-center hover:bg-red-950 hover:transition"
								>
									<InboxIcon />
								</button>
							{/if}
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
			{#if showFilterButton || showReviewButton}
				<div class="flex w-fit p-2 mt-2 mb-2 self-end bg-zinc-900 rounded-lg">
					{#if showFilterButton}
						<button
							class={`${isFilterSelectionVisible ? 'fill-red-900' : 'fill-white'}`}
							on:click={() => (isFilterSelectionVisible = !isFilterSelectionVisible)}
						>
							<FilterIcon />
						</button>
					{/if}

					{#if isInbox && showReviewButton}
						<Link
							href={mediaItems.length > 0 ? '/gallery/review' : ''}
							class={`${mediaItems.length > 0 ? 'cursor-pointer' : 'cursor-not-allowed'} ml-2`}
							>Start review</Link
						>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
	<div class="flex flex-1 relative">
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
									updateSearchParams('positiveQueryType', positiveQueryType);
								}}>AND</button
							>
							<button
								class={`${positiveQueryType === 'OR' ? 'bg-red-900' : 'bg-surface-color hover:bg-zinc-800 hover:transition'}  w-1/2 rounded-tr-md rounded-br-md`}
								on:click={() => {
									positiveQueryType = 'OR';
									updateSearchParams('positiveQueryType', positiveQueryType);
								}}>OR</button
							>
						</div>
					</div>
					<TagSearchInput
						availableTags={tags}
						appliedTags={appliedPositiveTags}
						class="outline-none min-h-[40px] indent-2"
						ignoredTags={appliedPositiveTags.concat(appliedNegativeTags)}
						createOnEnter={false}
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
									updateSearchParams('negativeQueryType', negativeQueryType);
								}}>AND</button
							>
							<button
								class={`${negativeQueryType === 'OR' ? 'bg-red-900' : 'bg-surface-color hover:bg-zinc-800 hover:transition'}  w-1/2 rounded-tr-md rounded-br-md`}
								on:click={() => {
									negativeQueryType = 'OR';
									updateSearchParams('negativeQueryType', negativeQueryType);
								}}>OR</button
							>
						</div>
					</div>
					<TagSearchInput
						availableTags={tags}
						appliedTags={appliedNegativeTags}
						class="outline-none min-h-[40px] indent-2"
						ignoredTags={appliedPositiveTags.concat(appliedNegativeTags)}
						createOnEnter={false}
						onTagSearchSubmit={onNegativeTagSearchSubmit}
						onAppliedTagClick={removeNegativeTagFilter}
					/>
				</div>
				<div>
					Sort by:
					<select
						bind:value={sortMethod}
						on:change={() => {
							updateSearchParams('sortMethod', sortMethod);
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
						class="h-[40px]"
						slot="content"
						bind:value={mediaType as string}
						on:change={() => {
							// TODO: Figure out why i need the timeout here
							setTimeout(() => {
								updateSearchParams('mediaType', mediaType);
							}, 10);
						}}
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
					{mediaItem}
					isAiGen={!!mediaItem.metadata?.model}
					isArchived={mediaItem.isArchived}
					onMoveToArchive={() => toggleArchivedStatus([mediaItem.id], !mediaItem.isArchived)}
					onMoveToInbox={() => toggleArchivedStatus([mediaItem.id], !mediaItem.isArchived)}
					onConfirmDelete={() => deleteItems([mediaItem.id])}
					onTagButtonClick={() => onTagButtonClick(mediaItem.id)}
					onSelectClick={() => onMediaItemSelect(mediaItem)}
					onAddToPlaylistClick={() => onAddToPlaylistClick(mediaItem)}
					onGotoGeneratorClick={() => goToGenerator(mediaItem.metadata)}
					isSelected={selectedItems.has(mediaItem.id)}
					{isSelectionModeActive}
					href={`/gallery/${mediaItem.id}${searchParams.size > 0 ? `?${searchParams.toString()}` : ''}`}
				>
					{#if mediaItem.type === 'image'}
						<img
							class="h-full"
							src={HttpService.buildGetImageThumbnailUrl(mediaItem.fileName, mediaItem.extension)}
							alt="gallery-img"
						/>
					{/if}
					{#if mediaItem.type === 'video'}
						<Video
							cssClass="bg-cover w-full h-full"
							src={HttpService.buildGetVideoThumbnailUrl(mediaItem.fileName)}
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
<Modal bind:showModal={isPlaylistModalOpen}>
	<div class="flex flex-col items-center justify-between flex-1 p-4">
		<div class="text-xl">Add to playlist</div>
		<div class="flex w-full flex-col gap-4 overflow-y-scroll mb-4">
			{#if playlists.length > 0}
				{#each playlists as playlist}
					<Button
						disabled={!!playlist.items.find((item) => item === mediaItemToAddToPlaylist?.id)}
						class={`${!!playlist.items.find((item) => item === mediaItemToAddToPlaylist?.id) ? 'bg-zinc-900' : ''} flex p-4 flex-1 flex-col `}
						onClick={async () => {
							isPlaylistModalOpen = false;
							await addMediaItemToPlaylist(playlist.id, mediaItemToAddToPlaylist!.id);
						}}
						>{playlist.name}</Button
					>
				{/each}
			{:else}
				<div class="text-2xl flex self-center">No playlists found</div>
			{/if}
		</div>
		<Button
			onClick={() => {
				isPlaylistCreationModalOpen = true;
				playlistCreationName = '';
			}}
			class="self-end flex w-full">Add to new Playlist</Button
		>
	</div>
	<Modal bind:showModal={isPlaylistCreationModalOpen}>
		<div class="flex flex-col gap-4 flex-1 p-4 justify-between">
			<LabeledComponent>
				<div slot="label">Playlist name</div>
				<TextInput slot="content" bind:value={playlistCreationName} />
			</LabeledComponent>
			<Button onClick={createPlaylist}>Create</Button>
		</div>
	</Modal>
</Modal>

<svelte:window on:keypress={onKeyPress} />

<svelte:head>
	<title>NoriBooru - Gallery</title>
</svelte:head>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import TagSearchInput from '$lib/components/TagSearchInput.svelte';
	import { endpoints } from '$lib/endpoints';
	import { HttpService } from '$lib/services/HttpService';
	import type { MediaItemMetadata, MediaItemWithTags } from '$lib/types/MediaItem';
	import type { PopulatedTag } from '$lib/types/PopulatedTag';
	import {
		ArrowLeft,
		ArrowRight,
		Button,
		createToast,
		TagIcon,
		TrashIcon
	} from '@lendruk/personal-svelte-ui-lib';
	import GalleryItemButton from '../GalleryItemButton.svelte';

	let foundTags: PopulatedTag[] = $state([]);
	let tags: PopulatedTag[] = $state([]);
	let tagSearchText = $state('');
	let mediaItem: MediaItemWithTags | undefined = $state(undefined);
	let next: string | undefined = $state(undefined);
	let previous: string | undefined = $state(undefined);

	let parsedMetadata: MediaItemMetadata | undefined = $state(undefined);

	let isItemFullscreen = $state(false);

	function onKeyDown(e: KeyboardEvent) {
		switch (e.key) {
			// Left
			case 'ArrowLeft':
				if (next) {
					goto(`/gallery/${next}${$page.url.search ? `${$page.url.search}` : ''}`);
				}
				break;
			case 'Escape':
				isItemFullscreen = false;
				break;
			// Right
			case 'ArrowRight':
				if (previous) {
					goto(`/gallery/${previous}${$page.url.search ? `${$page.url.search}` : ''}`);
				}
				break;
		}
	}

	$effect(() => {
		const params = new URLSearchParams($page.url.search);

		HttpService.get<{
			mediaItem: MediaItemWithTags;
			next?: string;
			previous?: string;
			tags: PopulatedTag[];
		}>(endpoints.mediaItem({ id: $page.params.id, params })).then((res) => {
			mediaItem = res.mediaItem;
			tags = res.tags;
			next = res.next;
			previous = res.previous;
			parsedMetadata = mediaItem.metadata;
		});
	});

	async function addTagToMedia(tag: PopulatedTag) {
		await HttpService.put(endpoints.mediaItemTags({ id: JSON.stringify([mediaItem?.id]) }), tag);
		mediaItem!.tags = [...mediaItem!.tags, { ...tag }];
		tagSearchText = '';
		foundTags = [];
	}

	async function removeTagFromMedia(tag: PopulatedTag) {
		await HttpService.delete(endpoints.mediaItemTags({ id: mediaItem?.id }), tag);
		mediaItem!.tags = mediaItem!.tags.filter((t) => t.id !== tag.id);
	}

	async function attemptAutoTag() {
		if (mediaItem) {
			await HttpService.patch(endpoints.autoTagMediaItem({ id: mediaItem.id }));
			const updatedItem = await HttpService.get<{
				mediaItem: MediaItemWithTags;
				next?: string;
				previous?: string;
				tags: PopulatedTag[];
			}>(endpoints.mediaItem({ id: $page.params.id }));

			mediaItem = updatedItem.mediaItem;
			tags = updatedItem.tags;
			next = updatedItem.next;
			previous = updatedItem.previous;
			parsedMetadata = updatedItem.mediaItem?.metadata;
		}
	}

	async function deleteMediaItem() {
		if (mediaItem) {
			await HttpService.delete(endpoints.mediaItem({ id: JSON.stringify([mediaItem.id]) }));
			let idToFetch: string = '';
			if (previous) {
				idToFetch = previous;
			} else if (next) {
				idToFetch = next;
			}

			if (idToFetch) {
				goto(`/gallery/${idToFetch}`);
			} else {
				goto('/gallery');
			}
			createToast('Item deleted successfully');
		}
	}

	function isItemAiGen(): boolean {
		return !!mediaItem?.metadata?.model;
	}
</script>

{#if !isItemFullscreen}
	<div class="flex flex-row min-h-full">
		<a
			href={next ? `/gallery/${next}${$page.url.search ? `?${$page.url.search}` : ''}` : '#'}
			class={`flex justify-center items-center w-1/12 hover:bg-slate-400 hover:bg-opacity-10 hover:transition ${!previous && 'cursor-not-allowed'}`}
			><ArrowLeft class="fill-white" /></a
		>
		<div class="flex flex-col items-center gap-8 flex-1 relative">
			<div class="absolute z-10 right-2 flex flex-col gap-4">
				{#if isItemAiGen() && mediaItem?.tags.length === 0}
					<GalleryItemButton onClick={attemptAutoTag}>
						<TagIcon />
					</GalleryItemButton>
				{/if}
				<GalleryItemButton onClick={deleteMediaItem}>
					<TrashIcon />
				</GalleryItemButton>
			</div>
			<div>
				{#if mediaItem?.type === 'image'}
					<img
						class="max-h-[80vh]"
						src={HttpService.buildGetImageUrl(mediaItem.fileName, mediaItem.extension)}
						alt="gallery-img"
					/>
				{/if}
				{#if mediaItem?.type === 'video'}
					<video
						class="bg-cover w-full h-full"
						src={HttpService.buildGetVideoUrl(mediaItem.fileName, mediaItem.extension)}
						controls
					>
						<track kind="captions" />
					</video>
				{/if}
			</div>
			{#if mediaItem?.type === 'image'}
				<Button onClick={() => (isItemFullscreen = true)}>Make fullscreen</Button>
			{/if}
			<div class="flex w-full flex-col flex-1">
				<p>Tags</p>
				{#if mediaItem}
					<TagSearchInput
						appliedTags={mediaItem.tags}
						availableTags={tags}
						ignoredTags={mediaItem.tags}
						onAppliedTagClick={removeTagFromMedia}
						onTagSearchSubmit={addTagToMedia}
					/>
				{/if}
			</div>
			<div>
				<!-- TODO prettify the exif output -->
				{JSON.stringify(parsedMetadata)}
			</div>
		</div>
		<a
			href={previous
				? `/gallery/${previous}${$page.url.search ? `?${$page.url.search}` : ''}`
				: '#'}
			class={`flex justify-center items-center w-1/12 hover:bg-slate-400 hover:bg-opacity-10 hover:transition fill-white ${!next && 'cursor-not-allowed'}`}
			><ArrowRight /></a
		>
	</div>
{/if}
{#if isItemFullscreen && mediaItem}
	<img
		src={HttpService.buildGetImageUrl(mediaItem.fileName, mediaItem.extension)}
		alt="fullscreen"
		class="absolute top-0 left-0 h-full w-full object-cover z-[100]"
	/>
{/if}

<svelte:window on:keydown={onKeyDown} />

<svelte:head>
	<title>NoriBooru - Media Item</title>
</svelte:head>

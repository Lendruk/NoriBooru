<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import TagSearchInput from '$lib/TagSearchInput.svelte';
	import ArrowLeft from '$lib/icons/ArrowLeft.svelte';
	import ArrowRight from '$lib/icons/ArrowRight.svelte';
	import { HttpService } from '$lib/services/HttpService';
	import type { MediaItemMetadata, MediaItemWithTags } from '$lib/types/MediaItem';
	import type { PopulatedTag } from '$lib/types/PopulatedTag';

	let foundTags: PopulatedTag[] = $state([]);
	let tags: PopulatedTag[] = $state([]);
	let tagSearchText = $state('');
	let mediaItem: MediaItemWithTags | undefined = $state(undefined);
	let next: string | undefined = $state(undefined);
	let previous: string | undefined = $state(undefined);

	let parsedMetadata: MediaItemMetadata | undefined = $state(undefined);

	function onKeyDown(e: KeyboardEvent) {
		switch (e.keyCode) {
			// Left
			case 37:
				if (next) {
					goto(`/gallery/${next}`);
				}
				break;
			// Right
			case 39:
				if (previous) {
					goto(`/gallery/${previous}`);
				}
				break;
		}
	}

	$effect(() => {
		HttpService.get<{
			mediaItem: MediaItemWithTags;
			next?: string;
			previous?: string;
			tags: PopulatedTag[];
		}>(`/mediaItems/${$page.params.id}`).then((res) => {
			mediaItem = res.mediaItem;
			tags = res.tags;
			next = res.next;
			previous = res.previous;
			parsedMetadata = mediaItem.metadata;
		});
	});

	async function addTagToMedia(tag: PopulatedTag) {
		await HttpService.put(`/mediaItems/${JSON.stringify([mediaItem?.id])}/tags`, tag);
		mediaItem!.tags = [...mediaItem!.tags, { ...tag }];
		tagSearchText = '';
		foundTags = [];
	}

	async function removeTagFromMedia(tag: PopulatedTag) {
		await HttpService.delete(`/mediaItems/${mediaItem?.id}/tags`, tag);
		mediaItem!.tags = mediaItem!.tags.filter((t) => t.id !== tag.id);
	}
</script>

<div class="flex flex-row min-h-full">
	<a
		href={previous ? `/gallery/${previous}` : '#'}
		class={`flex justify-center items-center w-1/12 hover:bg-slate-400 hover:bg-opacity-10 hover:transition ${!previous && 'cursor-not-allowed'}`}
		><ArrowLeft class="fill-white" /></a
	>
	<div class="flex flex-col items-center gap-8 flex-1">
		<div>
			{#if mediaItem?.type === 'image'}
				<img
					class="max-h-[80vh]"
					src={`${HttpService.BASE_URL}/images/${HttpService.getVaultId()}/${mediaItem.fileName}.${mediaItem.extension}`}
					alt="gallery-img"
				/>
			{/if}
			{#if mediaItem?.type === 'video'}
				<video
					class="bg-cover w-full h-full"
					src={`${HttpService.BASE_URL}/videos/${HttpService.getVaultId()}/${mediaItem.fileName}.${mediaItem.extension}`}
					controls
				>
					<track kind="captions" />
				</video>
			{/if}
		</div>
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
		href={next ? `/gallery/${next}` : '#'}
		class={`flex justify-center items-center w-1/12 hover:bg-slate-400 hover:bg-opacity-10 hover:transition fill-white ${!next && 'cursor-not-allowed'}`}
		><ArrowRight /></a
	>
</div>

<svelte:window on:keydown={onKeyDown} />

<svelte:head>
	<title>NoriBooru - Media Item</title>
</svelte:head>

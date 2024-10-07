<script context="module" lang="ts">
	import { endpoints } from '$lib/endpoints';
	import { HttpService } from '$lib/services/HttpService';
	import type { MediaItemWithTags } from '$lib/types/MediaItem';
	import type { PopulatedTag } from '$lib/types/PopulatedTag';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import Video from './Video.svelte';

	let isOpen = $state(false);
	let isLoading = $state(false);
	let mediaItem: MediaItemWithTags | undefined = $state(undefined);

	let container: HTMLDivElement;

	export const setItemPreview = async (parent: HTMLElement, itemId: number) => {
		container.style.top = `${parent.offsetTop + parent.offsetHeight / 2}px`;
		container.style.left = `${parent.offsetLeft + container.offsetWidth / 2}px`;
		isLoading = true;
		isOpen = true;
		console.log('test');
		const res = await HttpService.get<{
			mediaItem: MediaItemWithTags;
			next?: string;
			previous?: string;
			tags: PopulatedTag[];
		}>(endpoints.getMediaItem({ id: itemId }));
		mediaItem = res.mediaItem;
		isLoading = false;
	};
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	onmouseleave={() => (isOpen = false)}
	bind:this={container}
	class={`${isOpen ? 'flex' : 'hidden'} absolute z-[100] top-0 left-0 min-h-[50%] max-h-[50%] min-w-[50%] max-w-[50%] bg-zinc-950`}
>
	{#if isLoading}
		<LoadingSpinner />
	{:else}
		{#if mediaItem?.type === 'image'}
			<div
				class="bg-contain min-w-full min-h-full bg-no-repeat bg-center"
				style="background-image: url({HttpService.buildGetImageUrl(
					mediaItem.fileName,
					mediaItem.extension
				)});"
			></div>
		{/if}
		{#if mediaItem?.type === 'video'}
			<Video
				autoplay
				muted={false}
				cssClass="bg-cover w-full h-full"
				src={HttpService.buildGetVideoUrl(mediaItem.fileName, mediaItem.extension)}
			/>
		{/if}
	{/if}
</div>

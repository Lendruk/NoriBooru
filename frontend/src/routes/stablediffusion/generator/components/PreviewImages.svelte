<script lang="ts">
	import Button from '$lib/Button.svelte';
	import Tooltip from '$lib/Tooltip.svelte';
	import { createToast } from '$lib/components/toast/ToastContainer.svelte';
	import ArchiveIcon from '$lib/icons/ArchiveIcon.svelte';
	import ArrowLeft from '$lib/icons/ArrowLeft.svelte';
	import ArrowRight from '$lib/icons/ArrowRight.svelte';
	import InboxIcon from '$lib/icons/InboxIcon.svelte';
	import SeedIcon from '$lib/icons/SeedIcon.svelte';
	import TrashIcon from '$lib/icons/TrashIcon.svelte';
	import { HttpService } from '$lib/services/HttpService';
	import type { MediaItemMetadata } from '$lib/types/MediaItem';
	import GalleryItemButton from '../../../gallery/GalleryItemButton.svelte';
	// export let imageName: string;
	// export let imageId: number;

	export let images: {
		fileName: string;
		id: number;
		isArchived: boolean;
		metadata: MediaItemMetadata;
	}[];
	export let onSetSeed: (seed: number) => void;

	let currentIndex = 0;
	let isFullscreen = false;

	async function deleteItem() {
		const { id } = images[currentIndex];
		await HttpService.delete(`/mediaItems/${JSON.stringify([id])}`);

		if (images.length === 1) {
			images = [];
		} else {
			images.splice(currentIndex, 1);
			if (currentIndex - 1 >= 0) {
				currentIndex = currentIndex - 1;
			} else {
				currentIndex = 0;
			}
			images = images;
		}
	}

	async function toggleArchival() {
		const { id } = images[currentIndex];
		const isArchived = !images[currentIndex].isArchived;
		images[currentIndex].isArchived = isArchived;
		await HttpService.patch(`/mediaItems/${JSON.stringify([id])}`, { isArchived: isArchived });
		images = images;
		createToast(`Image ${isArchived ? 'archived' : 'un-archived'} successfully!`);
	}

	function onImageClick() {
		isFullscreen = !isFullscreen;
	}

	function onKeyPress(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			isFullscreen = false;
		}
	}
</script>

{#if isFullscreen}
	<div
		on:click={() => (isFullscreen = false)}
		class="flex items-center justify-center absolute h-full w-full top-0 left-0 z-50 backdrop-blur-sm"
	>
		<img
			class="bg-contain"
			src={`${HttpService.BASE_URL}/images/${HttpService.getVaultId()}/${images[currentIndex].fileName}.png`}
		/>
	</div>
{/if}
<div class="flex flex-1 flex-col items-center justify-center">
	{#if images.length > 0}
		<div class="flex flex-1 items-center justify-center w-full relative">
			<img
				on:click={() => onImageClick()}
				class="bg-contain h-[50%] w-[50%] cursor-pointer z-10"
				src={`${HttpService.BASE_URL}/images/${HttpService.getVaultId()}/${images[currentIndex].fileName}.png`}
				alt="gallery-img"
			/>
			<div class="absolute flex w-full h-full">
				<div class="flex justify-end self-end p-4">
					<Tooltip>
						<div slot="toolTipContent">Use seed</div>
						<span slot="target">
							<GalleryItemButton onClick={() => onSetSeed(images[currentIndex].metadata.seed)}>
								<SeedIcon />
							</GalleryItemButton>
						</span>
					</Tooltip>
				</div>
				<div class="flex justify-end items-end flex-1 self-end p-4 gap-2 flex-col">
					<GalleryItemButton onClick={toggleArchival}>
						{#if !images[currentIndex].isArchived}
							<InboxIcon />
						{:else}
							<ArchiveIcon />
						{/if}
					</GalleryItemButton>
					<GalleryItemButton onClick={deleteItem}>
						<TrashIcon />
					</GalleryItemButton>
				</div>
			</div>
		</div>
	{/if}
	{#if images.length > 1}
		<div class="flex w-full justify-between">
			<Button
				onClick={() => {
					if (currentIndex - 1 >= 0) currentIndex = currentIndex - 1;
				}}
				class={`h-[40px] fill-white ${currentIndex - 1 < 0 ? 'cursor-not-allowed' : ''}`}
			>
				<ArrowLeft />
			</Button>
			<Button
				onClick={() => {
					if (currentIndex + 1 < images.length) currentIndex = currentIndex + 1;
				}}
				class={`h-[40px] fill-white ${currentIndex + 1 >= images.length ? 'cursor-not-allowed' : ''}`}
			>
				<ArrowRight />
			</Button>
		</div>
	{/if}
</div>
<svelte:window on:keydown={onKeyPress} />

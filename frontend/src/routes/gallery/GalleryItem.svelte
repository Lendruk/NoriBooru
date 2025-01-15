<script lang="ts">
	import { setItemPreview } from '$lib/components/ItemPreview.svelte';
	import type { MediaItem } from '$lib/types/MediaItem';
	import {
		ArchiveIcon,
		CheckIcon,
		InboxIcon,
		PenIcon,
		PlayIcon,
		TagIcon,
		TrashIcon
	} from '@lendruk/personal-svelte-ui-lib';
	import { vaultStore } from '../../store';
	import GalleryItemButton from './GalleryItemButton.svelte';

	export let href = '';
	export let onConfirmDelete = () => {};
	export let onMoveToArchive = () => {};
	export let onMoveToInbox = () => {};
	export let onTagButtonClick = () => {};
	export let onAddToPlaylistClick = () => {};
	export let onGotoGeneratorClick: () => void;
	export let isArchived = false;
	export let style = '';
	export let mediaItem: MediaItem;

	export let isSelected = false;
	export let isAiGen = false;
	export let onSelectClick = () => {};
	export let isSelectionModeActive = false;
	export { className as class };

	let className = '';
	let confirmingDelete = false;
	let showOptions = false;

	let element: HTMLElement;
	let previewTimeout: NodeJS.Timeout | undefined;

	const reset = () => {
		confirmingDelete = false;
	};

	function onItemClick(e: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		if (isSelectionModeActive) {
			onSelectClick();
			e.preventDefault();
		}
	}

	function onMouseEnter() {
		showOptions = true;
	}

	function clearPreviewTimeout() {
		if (previewTimeout) {
			clearTimeout(previewTimeout);
		}
	}

	function registerPreviewTimeout() {
		if (previewTimeout) {
			clearTimeout(previewTimeout);
		}

		previewTimeout = setTimeout(() => {
			setItemPreview(element, mediaItem.id);
		}, 1500);
	}
</script>

<a
	bind:this={element}
	on:mouseenter={onMouseEnter}
	on:mouseleave={() => {
		showOptions = false;
		clearPreviewTimeout();
		reset();
	}}
	{style}
	class={`flex justify-center h-64 items-center ${isSelected ? 'border-red-900 bg-red-900' : 'border-zinc-900 bg-zinc-900'} border-2 rounded-md relative group ${className}`}
	href={isSelectionModeActive ? '' : href}
>
	<div
		class={`absolute inset-0 bg-black opacity-0 group-hover:transition-opacity group-hover:opacity-50 rounded-lg`}
	/>
	<!-- svelte-ignore a11y-no-static-element-interactions a11y-click-events-have-key-events -->
	<div
		class={`${!showOptions ? 'hidden' : 'flex'} flex-1 w-full h-full absolute top-0`}
		on:mouseenter={() => registerPreviewTimeout()}
		on:click={onItemClick}
	>
		<div class="flex flex-1 flex-col">
			<div class="m-2 flex flex-1">
				<div class="flex flex-1">
					<button
						class={`w-[12px] h-[12px] border-2 border-red-900 rounded-full items-center justify-center flex fill-white ${isSelected ? 'bg-red-900' : ''}`}
						on:click={(e) => {
							e.preventDefault();
							e.stopPropagation();
							onSelectClick();
						}}
					>
						{#if isSelected}
							<CheckIcon width={10} height={10} />
						{/if}
					</button>
				</div>
				<div class="flex flex-1 justify-end">
					{#if isArchived}
						<GalleryItemButton onClick={onMoveToInbox} onMouseEnter={clearPreviewTimeout}>
							<ArchiveIcon />
						</GalleryItemButton>
					{:else}
						<GalleryItemButton onClick={onMoveToArchive} onMouseEnter={clearPreviewTimeout}>
							<InboxIcon />
						</GalleryItemButton>
					{/if}
				</div>
			</div>
			<div class="flex gap-4 flex-1 items-end justify-end justify-items-end m-2">
				{#if $vaultStore?.hasInstalledSD && isAiGen}
					<GalleryItemButton onClick={onGotoGeneratorClick} onMouseEnter={clearPreviewTimeout}>
						<PenIcon />
					</GalleryItemButton>
				{/if}
				<GalleryItemButton onClick={onAddToPlaylistClick} onMouseEnter={clearPreviewTimeout}>
					<PlayIcon />
				</GalleryItemButton>
				<GalleryItemButton onClick={onTagButtonClick} onMouseEnter={clearPreviewTimeout}>
					<TagIcon />
				</GalleryItemButton>

				<!-- {#if confirmingDelete} -->
				<GalleryItemButton onClick={onConfirmDelete} onMouseEnter={clearPreviewTimeout}>
					<TrashIcon />
				</GalleryItemButton>
				<!-- {/if} -->
				<!-- {#if !confirmingDelete}
					<GalleryItemButton onClick={() => (confirmingDelete = true)}>
						<TrashIcon />
					</GalleryItemButton>
				{/if} -->
			</div>
		</div>
	</div>
	<slot />
</a>

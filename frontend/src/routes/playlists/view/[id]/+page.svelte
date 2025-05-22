<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { endpoints } from '$lib/endpoints';
	import { HttpService } from '$lib/services/HttpService';
	import type { MediaItem } from '$lib/types/MediaItem';
	import type { Playlist } from '$lib/types/Playlist';
	import { ArrowLeft, ArrowRight, PauseIcon, PlayIcon } from '@lendruk/personal-svelte-ui-lib';

	let currentMediaIndex = $state(0);
	let isPaused = $state(false);
	let timePerItem = $state(0);
	let items: MediaItem[] = $state([]);
	let currentMediaItem: MediaItem | undefined = $derived<MediaItem>(items[currentMediaIndex]);
	let intervalHandler: NodeJS.Timeout | undefined;

	$effect(() => {
		if ($page.params.id) {
			HttpService.get<Playlist>(endpoints.playlist({ id: $page.params.id })).then((res) => {
				timePerItem = res.timePerItem ?? 0;
				items = res.items ?? [];

				if (timePerItem && !intervalHandler) {
					intervalHandler = setInterval(() => {
						if (!isPaused) {
							if (currentMediaIndex + 1 >= items.length) {
								currentMediaIndex = 0;
							} else {
								currentMediaIndex = currentMediaIndex + 1;
							}
						}
					}, timePerItem * 1000);
				}
			});
		}

		return () => {
			clearInterval(intervalHandler);
			intervalHandler = undefined;
		};
	});

	function handlePause() {
		isPaused = !isPaused;
	}

	function handleClickLeft() {
		if (currentMediaIndex - 1 >= 0) {
			currentMediaIndex = currentMediaIndex - 1;
		}
	}

	function handleClickRight() {
		if (currentMediaIndex + 1 < items.length) {
			currentMediaIndex = currentMediaIndex + 1;
		}
	}

	function onKeyDown(e: KeyboardEvent) {
		switch (e.key) {
			case 'ArrowLeft':
				handleClickLeft();
				break;
			case 'ArrowRight':
				handleClickRight();
				break;
			case 'Escape':
				goto(`/playlists`);
				break;
			case ' ':
				handlePause();
				break;
		}
	}
</script>

<div class="flex flex-row flex-1 h-full absolute top-0 left-0 w-full z-[40]">
	<button
		on:click={handleClickLeft}
		class={`flex fill-white justify-center items-center w-1/12 bg-red-950 hover:bg-red-900 hover:transition ${currentMediaIndex - 1 < 0 && 'cursor-not-allowed'}`}
	>
		<ArrowLeft />
	</button>
	{#if currentMediaItem}
		<div
			class="flex flex-1 flex-col justify-center items-center bg-zinc-800 backdrop-blur-lg bg-opacity-5"
		>
			{#if currentMediaItem.type === 'image'}
				<img
					class="max-w-full max-h-full"
					src={HttpService.buildGetImageUrl(currentMediaItem.fileName, currentMediaItem.extension)}
					alt="gallery-img"
				/>
			{/if}
			{#if currentMediaItem.type === 'video'}
				<video
					class="bg-cover w-full h-full"
					src={HttpService.buildGetVideoUrl(currentMediaItem.fileName, currentMediaItem.extension)}
					controls
				>
					<track kind="captions" />
				</video>
			{/if}

			<button
				on:click={handlePause}
				class={`absolute flex items-center fill-white bg-red-950 rounded-full p-4 hover:bg-red-900 hover:transition bottom-0 ${timePerItem ? 'flex' : 'hidden'}`}
			>
				{#if isPaused}
					<PlayIcon width={50} height={50} />
				{:else}
					<PauseIcon width={50} height={50} />
				{/if}
			</button>
		</div>
	{/if}
	<button
		on:click={handleClickRight}
		class={`flex justify-center bg-red-950 hover:bg-red-900 hover:transition fill-white items-center w-1/12 ${currentMediaIndex + 1 >= items.length && 'cursor-not-allowed'}`}
	>
		<ArrowRight />
	</button>
</div>

<svelte:window on:keydown={onKeyDown} />

<svelte:head>
	<title>NoriBooru - Playlist View</title>
</svelte:head>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Button from '$lib/Button.svelte';
	import Checkbox from '$lib/Checkbox.svelte';
	import TrashIcon from '$lib/icons/TrashIcon.svelte';
	import { HttpService } from '$lib/services/HttpService';
	import SimpleTable from '$lib/SimpleTable.svelte';
	import TagSearchInput from '$lib/TagSearchInput.svelte';
	import type { MediaItem } from '$lib/types/MediaItem';
	import type { Playlist } from '$lib/types/Playlist';
	import type { PopulatedTag } from '$lib/types/PopulatedTag';
	import VerticalDrawer from '$lib/VerticalDrawer.svelte';
	import Video from '$lib/Video.svelte';
	import SidebarMediaItem from './SidebarMediaItem.svelte';
	import TableImage from './TableImage.svelte';

	let playlistName = $state('');
	let timePerItem = $state(0);
	let randomizeOrder = $state(false);
	let availableTags = $state<PopulatedTag[]>([]);
	let playlistItems: MediaItem[] = $state([]);

	$effect(() => {
		HttpService.get<PopulatedTag[]>(`/tags`).then((tags) => {
			availableTags = tags;
		});

		if ($page.params.id && $page.params.id !== 'new') {
			HttpService.get<Playlist>(`/playlists/${$page.params.id}`).then((res) => {
				playlistName = res.name;
				randomizeOrder = res.randomizeOrder === 1;
				playlistItems = res.items;
				timePerItem = res.timePerItem ?? 0;
			});
		}
	});

	// Sidebar props
	let foundTags: PopulatedTag[] = $state([]);
	let filterTags: PopulatedTag[] = $state([]);
	let tagSearchInputText = $state('');
	let sidebarMediaItems: MediaItem[] = $state([]);
	let selectedSidebarMediaItems: MediaItem[] = $state([]);
	let mediaSearchSidebarOpen = $state(false);

	async function onTagSearchChange() {
		if (tagSearchInputText.length > 0) {
			const response = await HttpService.get<PopulatedTag[]>(`/tags?name=${tagSearchInputText}`);

			foundTags = response;
			foundTags = foundTags.filter((tag) => !filterTags.find((t) => t.id === tag.id));
		} else {
			foundTags = [];
		}
	}

	async function addTagToFilter(tag: PopulatedTag) {
		filterTags = [...filterTags, tag];
		foundTags = [];
		tagSearchInputText = '';

		if (filterTags.length > 0) {
			await searchMedia();
		}
	}

	async function removeTagFromFilter(tag: PopulatedTag) {
		filterTags = filterTags.filter((t) => t.id !== tag.id);

		if (filterTags.length > 0) {
			await searchMedia();
		} else {
			sidebarMediaItems = [];
		}
	}

	async function searchMedia() {
		const newItems = await HttpService.get<{ mediaItems: MediaItem[] }>(
			'/mediaItems?' +
				new URLSearchParams({
					// negativeTags: JSON.stringify(appliedNegativeTags.map(tag => tag.id)),
					positiveTags: JSON.stringify(filterTags.map((tag) => tag.id)),
					archived: 'true'
				})
		);
		sidebarMediaItems = newItems.mediaItems.filter(
			(item) => !playlistItems.find((i) => i.id === item.id)
		);
	}

	function onSubmitSidebar() {
		mediaSearchSidebarOpen = false;
		playlistItems = [...playlistItems, ...selectedSidebarMediaItems];
		sidebarMediaItems = [];
		selectedSidebarMediaItems = [];
		tagSearchInputText = '';
		foundTags = [];
		filterTags = [];
	}

	function removePlaylistItem(itemId: number) {
		playlistItems = playlistItems.filter((item) => item.id !== itemId);
	}

	function moveMediaItemUp(itemId?: string | number) {
		const index = playlistItems.findIndex((i) => i.id === itemId);
		if (index > 0) {
			const temp = playlistItems[index - 1];
			playlistItems[index - 1] = playlistItems[index];
			playlistItems[index] = temp;
		}
	}

	function moveMediaItemDown(itemId?: string | number) {
		const index = playlistItems.findIndex((i) => i.id === itemId);
		if (index < playlistItems.length - 1) {
			const temp = playlistItems[index + 1];
			playlistItems[index + 1] = playlistItems[index];
			playlistItems[index] = temp;
		}
	}

	async function createPlaylist() {
		const newPlaylist = await HttpService.post<Playlist>('/playlists', {
			name: playlistName,
			randomizeOrder,
			timePerItem,
			items: playlistItems.map((item) => item.id)
		});
		goto(`/playlists/${newPlaylist.id}`);
	}

	async function updatePlaylist() {
		await HttpService.put(`/playlists/${$page.params.id}`, {
			name: playlistName,
			randomizeOrder,
			timePerItem,
			items: playlistItems.map((item) => item.id)
		});
	}
</script>

<div class="flex flex-col flex-1 justify-between bg-zinc-900 rounded-md">
	<Button
		class="w-[150px] h-[40px] self-end mr-4 mt-4"
		onClick={() => ($page.params.id !== 'new' ? updatePlaylist() : createPlaylist())}
		>{$page.params.id !== 'new' ? 'Update' : 'Create'}</Button
	>
	<div class="flex flex-1 flex-col p-4">
		<div>
			<div class="flex flex-col gap-4">
				<label for="playlistName">Name</label>
				<input
					name="playlistName"
					class="outline-none h-[40px] indent-2 bg-zinc-800 rounded-md"
					type="test"
					placeholder="Name.."
					bind:value={playlistName}
				/>
			</div>
			<div class="flex flex-col gap-4">
				<label for="playlistTPI">Time per item</label>
				<input
					name="playlistTPI"
					class="outline-none h-[40px] indent-2 bg-zinc-800 rounded-md"
					type="number"
					placeholder="Time per item.."
					bind:value={timePerItem}
				/>
			</div>
			<Checkbox class="mt-4 mb-4" bind:isChecked={randomizeOrder} />
		</div>

		<div>
			<div class="flex flex-row gap-4 mb-4">
				<div>Media Items</div>
				<Button onClick={() => (mediaSearchSidebarOpen = !mediaSearchSidebarOpen)}>Add</Button>
			</div>
			<div>
				<SimpleTable
					cols={[
            { header: 'Media', customRender: TableImage },
            { 
              key: 'createdAt', 
              header: 'CreatedAt', 
              formatter: (val) => new Date(val as number).toDateString(),
            },
          ]}
					rows={playlistItems}
					actions={[
            { icon: TrashIcon, name: 'Delete', onClick: (id) => { removePlaylistItem(id as number)} }
          ]}
					orderable={{
						onMoveDown: moveMediaItemDown,
						onMoveUp: moveMediaItemUp
					}}
				/>
			</div>
		</div>
	</div>
	<VerticalDrawer isDrawerOpen={mediaSearchSidebarOpen}>
		<div class="flex flex-1 flex-col">
			<TagSearchInput
				{availableTags}
				appliedTags={filterTags}
				class="outline-none min-h-[40px] indent-2 m-2 w-auto"
				onTagSearchSubmit={async (tag) => {
					filterTags.push(tag);

					if (filterTags.length > 0) {
						await searchMedia();
					}
				}}
				onAppliedTagClick={(tag) => {
					const index = filterTags.findIndex((t) => t.id === tag.id);

					if (index !== -1) {
						filterTags.splice(index, 1);
					}
				}}
			/>
			<div class="flex flex-wrap h-full overflow-scroll">
				{#each sidebarMediaItems as mediaItem}
					<SidebarMediaItem
						onRemoveClick={() => {
							selectedSidebarMediaItems = selectedSidebarMediaItems.filter(
								(t) => t.id !== mediaItem.id
							);
						}}
						onAddClick={() => {
							selectedSidebarMediaItems.push(mediaItem);
						}}
					>
						{#if mediaItem.type === 'image'}
							<img
								class="bg-cover"
								src={`${HttpService.BASE_URL}/images/${HttpService.getVaultId()}/${mediaItem.fileName}.${mediaItem.extension}`}
								alt="gallery-img"
							/>
						{/if}
						{#if mediaItem.type === 'video'}
							<Video
								cssClass="bg-cover w-full h-full"
								src={`${HttpService.BASE_URL}/videos/${HttpService.getVaultId()}/${mediaItem.fileName}.${mediaItem.extension}`}
							/>
						{/if}
					</SidebarMediaItem>
				{/each}
			</div>

			<Button class="bg-zinc-900 h-[40px] ml-4 mr-4 mb-4" onClick={onSubmitSidebar}>Submit</Button>
		</div>
	</VerticalDrawer>
</div>

<svelte:head>
	<title>NoriBooru - Playlist Edit</title>
</svelte:head>

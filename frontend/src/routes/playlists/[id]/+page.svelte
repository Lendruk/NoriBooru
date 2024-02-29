<script lang="ts">
	import { goto } from "$app/navigation";
  import { page } from "$app/stores";
	import Video from "$lib/Video.svelte";
	import TrashIcon from "$lib/icons/TrashIcon.svelte";
	import SidebarMediaItem from "./SidebarMediaItem.svelte";
	import ChevronUp from "$lib/icons/ChevronUp.svelte";
	import ChevronDown from "$lib/icons/ChevronDown.svelte";
	import { HttpService } from "$lib/services/HttpService";
	import type { MediaItem } from "$lib/types/MediaItem";
	import type { TagDef } from "$lib/types/TagDef";
	import type { Playlist } from "$lib/types/Playlist";
  let playlistName = $state('');
  let timePerItem = $state(0);
  let randomizeOrder = $state(false);
  let playlistItems: MediaItem[] = $state([]);

  $effect(() => {
    if ($page.params.id && $page.params.id !== "new") {
      HttpService.get<Playlist>(`/playlists/${$page.params.id}`).then(res => {
        playlistName = res.name;
        randomizeOrder = res.randomizeOrder === 1;
        playlistItems = res.items;
        timePerItem = res.timePerItem ?? 0;
      });
    }
  });
  
  // Sidebar props
  let foundTags: TagDef[] = $state([]);
  let filterTags: TagDef[] = $state([]);
  let tagSearchInputText = $state('');
  let sidebarMediaItems: MediaItem[] = $state([]);
  let selectedSidebarMediaItems: MediaItem[] = $state([]);
  let mediaSearchSidebarOpen = $state(false);

  async function onTagSearchChange() {
    if (tagSearchInputText.length > 0) {
      const response = await HttpService.get<TagDef[]>(`/tags?name=${tagSearchInputText}`);

      foundTags = response;
      foundTags = foundTags.filter(tag => !filterTags.find(t => t.id === tag.id));
    } else {
      foundTags = [];
    }
  }

  async function addTagToFilter(tag: TagDef) {
    filterTags = [...filterTags, tag];
    foundTags = [];
    tagSearchInputText = '';

    if (filterTags.length > 0) {
      await searchMedia();
    }
  }

  async function removeTagFromFilter(tag: TagDef) {
    filterTags = filterTags.filter(t => t.id !== tag.id);

    if (filterTags.length > 0) {
      await searchMedia();
    } else {
      sidebarMediaItems = [];
    }
  }

  async function searchMedia() {
    const newItems = await HttpService.get<{ mediaItems: MediaItem[] }>('/mediaItems?' + new URLSearchParams(
      { 
        // negativeTags: JSON.stringify(appliedNegativeTags.map(tag => tag.id)), 
        positiveTags: JSON.stringify(filterTags.map(tag => tag.id )),
      }));
    sidebarMediaItems = newItems.mediaItems.filter(item => !playlistItems.find(i => i.id === item.id));
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

  function removePlaylistItem(itemToRemove: MediaItem) {
    playlistItems = playlistItems.filter(item => item.id !== itemToRemove.id);
  }

  function moveMediaItemUp(item: MediaItem) {
    const index = playlistItems.findIndex(i => i.id === item.id);
    if (index > 0) {
      const temp = playlistItems[index - 1];
      playlistItems[index - 1] = item;
      playlistItems[index] = temp;
    }
  }

  function moveMediaItemDown(item: MediaItem) {
    const index = playlistItems.findIndex(i => i.id === item.id);
    if (index < playlistItems.length - 1) {
      const temp = playlistItems[index + 1];
      playlistItems[index + 1] = item;
      playlistItems[index] = temp;
    }
  }

  async function createPlaylist() {
    const newPlaylist = await HttpService.post<Playlist>('/playlists', {
      name: playlistName,
      randomizeOrder,
      timePerItem,
      items: playlistItems.map(item => item.id),
    });
    goto(`/playlists/${newPlaylist.id}`);
  }

  async function updatePlaylist() {
    await HttpService.put(`/playlists/${$page.params.id}`, {
      name: playlistName,
      randomizeOrder,
      timePerItem,
      items: playlistItems.map(item => item.id),
    });
  }
</script>

<div class="flex flex-row flex-1 justify-between bg-zinc-900 m-2 rounded-md h-full">
  <div class="flex flex-1 flex-col p-4">
    <div>
      <div class="flex flex-col gap-4">
        <label for="playlistName">Name</label>
        <input name="playlistName" class="outline-none h-[40px] indent-2 bg-zinc-800 rounded-md" type="test" placeholder="Name.." bind:value={playlistName} />
      </div>
      <div class="flex flex-col gap-4">
        <label for="playlistTPI">Time per item</label>
        <input name="playlistTPI" class="outline-none h-[40px] indent-2 bg-zinc-800 rounded-md" type="number" placeholder="Time per item.." bind:value={timePerItem} />
      </div>
      <div class="flex gap-2">
        <span>Randomize order</span>
        <input type="checkbox" bind:checked={randomizeOrder} />
      </div>
    </div>
  
    <div>
      <div class="flex flex-row gap-4"> 
        <div>Media Items</div>
        <button on:click={() => mediaSearchSidebarOpen = !mediaSearchSidebarOpen }>Add</button>
      </div>
      <div>
        {#each playlistItems as item, index}
          <div class="flex flex-row flex-1 gap-2">
            <div class="flex flex-col">
              {#if index !== 0}
                <button on:click={() => moveMediaItemUp(item)}>
                  <ChevronUp />
                </button>
              {/if}
              {#if index !== playlistItems.length - 1}
                <button on:click={() => moveMediaItemDown(item)}>
                  <ChevronDown />
                </button>
              {/if}
            </div>
            <div style="width: 50px;height: 50px">
            {#if item.type === "image"}
              <img class="bg-cover" src={`${HttpService.BASE_URL}/images/${HttpService.getVaultId()}/${item.fileName}.${item.extension}`} alt="gallery-img" />
            {:else}
              <video class="bg-cover w-full h-full" src={`/videos/${HttpService.getVaultId()}/${item.fileName}.${item.extension}`} controls={false}/>
            {/if}
            </div>
            <div>
              {item.createdAt}
            </div>
            <button on:click={() => removePlaylistItem(item)}>
              <TrashIcon />
            </button>
          </div>
        {/each}
      </div>
    </div>
    <button class="flex self-end p-4" on:click={() => $page.params.id !== 'new' ? updatePlaylist() : createPlaylist()}>{$page.params.id !== 'new' ? 'Update' : 'Create'}</button>
  </div>
  <div class={`${mediaSearchSidebarOpen ? 'flex' : 'hidden'} w-1/2 h-full bg-slate-700`}>
    <div class="flex flex-1 flex-col">
      <input bind:value={tagSearchInputText} on:input={onTagSearchChange} class="w-full" type="text" placeholder="Search tags.." />
      <div class="flex text-sm w-full flex-wrap gap-2">
        {#each filterTags as tag}
          <div class="bg-green-400 flex flex-row gap-2 p-1">
            <div>{tag.name}</div>
            <button on:click={() => removeTagFromFilter(tag)}>X</button>
          </div>
        {/each}
        {#each foundTags as tag}
          <div on:click={() => addTagToFilter(tag)}>{tag.name}</div>
        {/each}
      </div>
      <div class="flex flex-wrap h-full overflow-scroll">
        {#each sidebarMediaItems as mediaItem}
          <SidebarMediaItem 
            onRemoveClick={() => { selectedSidebarMediaItems = selectedSidebarMediaItems.filter(t => t.id !== mediaItem.id) }} 
            onAddClick={() => { selectedSidebarMediaItems.push(mediaItem); }}
          >
          {#if mediaItem.type === "image"}
            <img class="bg-cover" src={`${HttpService.BASE_URL}/images/${HttpService.getVaultId()}/${mediaItem.fileName}.${mediaItem.extension}`} alt="gallery-img" />
          {/if}
          {#if mediaItem.type === "video"}
            <Video cssClass="bg-cover w-full h-full" src={`/videos/${HttpService.getVaultId()}/${mediaItem.fileName}.${mediaItem.extension}`} />
          {/if}
          </SidebarMediaItem>
        {/each}
      </div>

      <button on:click={onSubmitSidebar}>Submit</button>
    </div>
  </div>
</div>
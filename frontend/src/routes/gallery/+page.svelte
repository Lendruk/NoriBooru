<script lang="ts">
	import Video from '$lib/Video.svelte';
	import type { MediaItem } from '$lib/types/MediaItem';
	import { onMount, tick } from 'svelte';
	import GalleryItem from './GalleryItem.svelte';
	import { HttpService } from '$lib/services/HttpService';
	import TagSearchInput from '$lib/TagSearchInput.svelte';
	import Modal from '$lib/Modal.svelte';
	import { pause } from '$lib/utils/time';
	import type { PopulatedTag } from '$lib/types/PopulatedTag';
	import FilterIcon from '$lib/icons/FilterIcon.svelte';

  let mediaItems: MediaItem[]  = [];
  let appliedPositiveTags: PopulatedTag[] = [];
  let positiveQueryType: "AND" | "OR" = "AND";
  let appliedNegativeTags: PopulatedTag[] = [];
  let negativeQueryType: "AND" | "OR" = "AND";
  let tags: PopulatedTag[] = [];
  let sortMethod: 'newest' | 'oldest' = 'newest';
  let showMediaTagEditModal = false;
  let currentPage = 0;
  let hasMoreItems = true;
  let fetchingItems = false;
  let isFilterSelectionVisible = false;
  let mediaItemInTagEdit: { id: number; tags: PopulatedTag[] } | undefined;

  let oldHeight = 0;

  let galleryDiv: HTMLDivElement;
	onMount(async () => {
    await search();
    tags = await HttpService.get<PopulatedTag[]>('/tags');

	});

  async function applyPositiveTagFilter(tag: PopulatedTag) {
    appliedPositiveTags = [...appliedPositiveTags, tag];
    currentPage = 0;
    hasMoreItems = true;
    oldHeight = 0;
    await search();
  }

  async function applyNegativeTagFilter(tag: PopulatedTag) {
    appliedNegativeTags = [...appliedNegativeTags, tag];
    currentPage = 0;
    hasMoreItems = true;
    oldHeight = 0;
    await search();
  }

  async function removeTagFromMediaItem(tag: PopulatedTag, mediaItemId: number) {
    await HttpService.delete(`/mediaItems/${mediaItemId}/tags`, { ...tag });
    const tagIndex = mediaItemInTagEdit!.tags.findIndex(mediaTag => mediaTag.id === tag.id);
    mediaItemInTagEdit!.tags.splice(tagIndex, 1);
    mediaItemInTagEdit!.tags = mediaItemInTagEdit!.tags;
  }

  async function addTagToMediaItem(tag: PopulatedTag, mediaItemId: number) {
    await HttpService.put(`/mediaItems/${mediaItemId}/tags`, { ...tag });
    mediaItemInTagEdit!.tags.push(tag);
    mediaItemInTagEdit!.tags = mediaItemInTagEdit!.tags;
  }

  async function search(appendResults: boolean = false) {
    fetchingItems = true;
    const res = await HttpService.get<{ mediaItems: MediaItem[] }>('/mediaItems?' + new URLSearchParams(
      { 
        negativeTags: JSON.stringify(appliedNegativeTags.map(tag => tag.id)), 
        positiveTags: JSON.stringify(appliedPositiveTags.map(tag => tag.id )),
        positiveQueryType,
        negativeQueryType,
        sortMethod,
        archived: 'true',
        page: currentPage.toString(),
      }));

      if (appendResults) {
        if(res.mediaItems.length > 0) {
          mediaItems = mediaItems.concat(res.mediaItems);
        } else {
          hasMoreItems = false;
        }
      } else {
        mediaItems = res.mediaItems;
      }
    await pause(1000);
    fetchingItems = false;
  }

  async function removePositiveTagFilter(tag: PopulatedTag) {
    appliedPositiveTags = appliedPositiveTags.filter(t => t.id !== tag.id);
    currentPage = 0;
    hasMoreItems = true;
    await search();
  }

  async function removeNegativeTagFilter(tag: PopulatedTag) {
    appliedNegativeTags = appliedNegativeTags.filter(t => t.id !== tag.id);
    currentPage = 0;
    hasMoreItems = true;
    await search();
  }

  async function deleteItem(mediaItemId: number) {
    await HttpService.delete(`/mediaItems/${mediaItemId}`);
    mediaItems = mediaItems.filter(item => item.id !== mediaItemId);
  }

  async function toggleArchivedStatus(mediaItemId: number, isArchived: boolean) {
    await HttpService.patch(`/mediaItems/${mediaItemId}`, { isArchived: !isArchived });
    mediaItems = mediaItems.map(item => item.id === mediaItemId ? { ...item, isArchived: !isArchived } : item);
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

  function onKeyPress(event: KeyboardEvent) {
    if(event.key === "f" || event.key === "F") {
      isFilterSelectionVisible = !isFilterSelectionVisible;
    }
  }

  async function onWindowScroll(e:  UIEvent & {
    currentTarget: EventTarget & Window;
  }) {
    if (e.currentTarget.scrollY + e.currentTarget.innerHeight >= document.documentElement.scrollHeight -50) {
      if(hasMoreItems && !fetchingItems) {
        currentPage = currentPage + 1;
        oldHeight = galleryDiv.clientHeight;
        await search(true);
      }
    }
  }

  $: {
      if (mediaItems.length > 0 && oldHeight !== 0) {
        tick().then(() => {
          window.scrollBy({ top: -(galleryDiv.clientHeight - oldHeight), behavior: 'instant'});
        })
      }
    }
</script>

<div class="flex flex-1 justify-end mr-2">
  <div class="flex w-fit p-2 mt-2 mb-2 justify-center bg-zinc-900 rounded-lg">
    <button class={`${isFilterSelectionVisible ? 'fill-red-900' : 'fill-white'}`} on:click={() => isFilterSelectionVisible = !isFilterSelectionVisible}>
      <FilterIcon />
    </button>
  </div>
</div>
<div class="flex flex-1 h-full">
    {#if isFilterSelectionVisible}
      <div class="bg-zinc-900 rounded-lg p-2 ml-2 flex flex-col w-[40%]">
        <div class="text-3xl mb-4">Filters</div>
        <div class="flex flex-col mb-2">
          <div class="mb-2 flex justify-between">
            <div >Positive Tags</div>
            <div class="flex flex-1 max-w-[150px]">
              <button class={`${positiveQueryType === "AND" ? 'bg-red-900' : 'bg-surface-color hover:bg-zinc-800 hover:transition' } w-1/2 rounded-tl-md rounded-bl-md`} on:click={() => {positiveQueryType = "AND"; search() }}>AND</button>
              <button class={`${positiveQueryType === "OR" ? 'bg-red-900' : 'bg-surface-color hover:bg-zinc-800 hover:transition' }  w-1/2 rounded-tr-md rounded-br-md`} on:click={() => {positiveQueryType = "OR"; search() }}>OR</button>
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
            <div >Negative Tags</div>
            <div class="flex flex-1 max-w-[150px]">
              <button class={`${negativeQueryType === "AND" ? 'bg-red-900' : 'bg-surface-color hover:bg-zinc-800 hover:transition' } w-1/2 rounded-tl-md rounded-bl-md`} on:click={() => {negativeQueryType = "AND"; search() }}>AND</button>
              <button class={`${negativeQueryType === "OR" ? 'bg-red-900' : 'bg-surface-color hover:bg-zinc-800 hover:transition' }  w-1/2 rounded-tr-md rounded-br-md`} on:click={() => {negativeQueryType = "OR"; search() }}>OR</button>
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
          <select bind:value={sortMethod} on:change={() => search()} class="text-black" >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>
    {/if}
    <div bind:this={galleryDiv} class="grid w-full gap-2 justify-center p-2"
    style={`grid-template-columns: repeat(auto-fit, minmax(208px, 1fr));`}
    >
      {#each mediaItems as mediaItem}
        <GalleryItem 
          isArchived={mediaItem.isArchived} onMoveToArchive={() => toggleArchivedStatus(mediaItem.id, mediaItem.isArchived)} 
          onMoveToInbox={() => toggleArchivedStatus(mediaItem.id, mediaItem.isArchived)}  
          onConfirmDelete={() => deleteItem(mediaItem.id)} 
          onTagButtonClick={() => onTagButtonClick(mediaItem.id)}
          className="flex justify-center h-64 items-center border-zinc-900 bg-zinc-900 border-2 rounded-md" 
          href={`/gallery/${mediaItem.id}`}
        >
          {#if mediaItem.type === "image"}
            <img class="h-full" src={`${HttpService.BASE_URL}/images/${HttpService.getVaultId()}/thumb/${mediaItem.fileName}.jpg`} alt="gallery-img" />
          {/if}
          {#if mediaItem.type === "video"}
            <Video cssClass="bg-cover w-full h-full" src={`${HttpService.BASE_URL}/videos/${HttpService.getVaultId()}/${mediaItem.fileName}.${mediaItem.extension}`} />
          {/if}
        </GalleryItem>
      {/each}
      {#if mediaItems.length === 0}
        <div class="text-4xl bg-zinc-900 p-4 rounded-md flex justify-center self-center">
          No items in gallery
        </div>
      {/if}
    </div>
</div>
<Modal class="w-[40%]" bind:showModal={showMediaTagEditModal}>
  <div class="p-4 flex flex-col w-full">
    <div class="text-xl mb-4">
      Modify media item tags
    </div>
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

<svelte:window on:scroll={onWindowScroll} on:keypress={onKeyPress} />

<svelte:head>
  <title>NoriBooru - Gallery</title>
</svelte:head>
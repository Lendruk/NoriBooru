<script lang="ts">
	import Video from '$lib/Video.svelte';
	import type { MediaItem } from '$lib/types/MediaItem';
	import { onMount, tick } from 'svelte';
	import GalleryItem from './GalleryItem.svelte';
	import { HttpService } from '$lib/services/HttpService';
	import Accordeon from '$lib/Accordeon.svelte';
	import TagSearchInput from '$lib/TagSearchInput.svelte';
	import type { TagDef } from '$lib/types/TagDef';
	import Modal from '$lib/Modal.svelte';
	import { pause } from '$lib/utils/time';

  let mediaItems: MediaItem[]  = [];
  let appliedPositiveTags: TagDef[] = [];
  let appliedNegativeTags: TagDef[] = [];
  let tags: TagDef[] = [];
  let sortMethod: 'newest' | 'oldest' = 'newest';
  let showMediaTagEditModal = false;
  let currentPage = 0;
  let hasMoreItems = true;
  let fetchingItems = false;
  let mediaItemInTagEdit: { id: number; tags: TagDef[] } | undefined;

  let oldHeight = 0;

  let galleryDiv: HTMLDivElement;
	onMount(async () => {
    await search();
    tags = await HttpService.get<TagDef[]>('/tags');

	});

  async function applyPositiveTagFilter(tag: TagDef) {
    appliedPositiveTags = [...appliedPositiveTags, tag];
    currentPage = 0;
    hasMoreItems = true;
    oldHeight = 0;
    await search();
  }

  async function applyNegativeTagFilter(tag: TagDef) {
    appliedNegativeTags = [...appliedNegativeTags, tag];
    currentPage = 0;
    hasMoreItems = true;
    oldHeight = 0;
    await search();
  }

  async function removeTagFromMediaItem(tag: TagDef, mediaItemId: number) {
    await HttpService.delete(`/mediaItems/${mediaItemId}/tags`, { ...tag });
    const tagIndex = mediaItemInTagEdit!.tags.findIndex(mediaTag => mediaTag.id === tag.id);
    mediaItemInTagEdit!.tags.splice(tagIndex, 1);
    mediaItemInTagEdit!.tags = mediaItemInTagEdit!.tags;
  }

  async function addTagToMediaItem(tag: TagDef, mediaItemId: number) {
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

  async function removePositiveTagFilter(tag: TagDef) {
    appliedPositiveTags = appliedPositiveTags.filter(t => t.id !== tag.id);
    currentPage = 0;
    hasMoreItems = true;
    await search();
  }

  async function removeNegativeTagFilter(tag: TagDef) {
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
    const tags = await HttpService.get<TagDef[]>(`/mediaItems/${mediaItemId}/tags`);
    mediaItemInTagEdit = { id: mediaItemId, tags };
  }

  function onPositiveTagSearchSubmit(tag: TagDef) {
    applyPositiveTagFilter(tag);
  }

  function onNegativeTagSearchSubmit(tag: TagDef) {
    applyNegativeTagFilter(tag);
  }

  async function onTagButtonClick(mediaItemId: number) {
    await fetchMediaItemTags(mediaItemId);
    showMediaTagEditModal = !showMediaTagEditModal;
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

<div class="flex flex-row flex-1 justify-between">
  <div />
</div>

<div class="flex flex-col flex-1 h-full">
  <Accordeon header="Filters">
    <div class="mb-2">Positive Tags</div>
      <TagSearchInput 
        availableTags={tags} 
        appliedTags={appliedPositiveTags}
        class="outline-none min-h-[40px] indent-2"
        ignoredTags={appliedPositiveTags.concat(appliedNegativeTags)} 
        onTagSearchSubmit={onPositiveTagSearchSubmit} 
        onAppliedTagClick={removePositiveTagFilter}
      />
    <div class="mb-2">Negative Tags</div>
      <TagSearchInput 
        availableTags={tags} 
        appliedTags={appliedNegativeTags}
        class="outline-none min-h-[40px] indent-2"
        ignoredTags={appliedPositiveTags.concat(appliedNegativeTags)} 
        onTagSearchSubmit={onNegativeTagSearchSubmit} 
        onAppliedTagClick={removeNegativeTagFilter}
      />
    <div>
      Sort by: 
      <select bind:value={sortMethod} on:change={() => search()} class="text-black" >
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
      </select>
    </div>
  </Accordeon>
    <div bind:this={galleryDiv} class="grid w-full gap-2 justify-center p-4"
    style={`grid-template-columns: repeat(auto-fit, minmax(208px, 1fr));`}
    >
      {#each mediaItems as mediaItem}
        <GalleryItem 
          isArchived={mediaItem.isArchived} onMoveToArchive={() => toggleArchivedStatus(mediaItem.id, mediaItem.isArchived)} 
          onMoveToInbox={() => toggleArchivedStatus(mediaItem.id, mediaItem.isArchived)}  
          onConfirmDelete={() => deleteItem(mediaItem.id)} 
          onTagButtonClick={() => onTagButtonClick(mediaItem.id)}
          className="flex justify-center h-64 items-center border-zinc-900 border-2 rounded-md" 
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

<svelte:window on:scroll={onWindowScroll} />
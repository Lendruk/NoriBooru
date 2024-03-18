<script lang="ts">
	import Video from "$lib/Video.svelte";
	import { HttpService } from "$lib/services/HttpService";
	import type { MediaItem } from "$lib/types/MediaItem";
	import { onMount } from "svelte";
	import GalleryItem from "../GalleryItem.svelte";
	import type { PopulatedTag } from "$lib/types/PopulatedTag";
  let mediaItems: MediaItem[]  = [];
  let tags: PopulatedTag[] = [];

  onMount(async () => {
    await search();
    tags = await HttpService.get<PopulatedTag[]>('/tags');
	});

  async function search() {
    const res = await HttpService.get<{ mediaItems: MediaItem[] }>('/mediaItems?' + new URLSearchParams(
      { 
        archived: 'false',
      }));

      mediaItems = res.mediaItems;
  }
  
  async function deleteItem(mediaItemId: number) {
    await HttpService.delete(`/mediaItems/${mediaItemId}`);
    mediaItems = mediaItems.filter(item => item.id !== mediaItemId);
  }

  async function toggleArchivedStatus(mediaItemId: number, isArchived: boolean) {
    await HttpService.patch(`/mediaItems/${mediaItemId}`, { isArchived: !isArchived });
    mediaItems = mediaItems.map(item => item.id === mediaItemId ? { ...item, isArchived: !isArchived } : item);
  }
</script>

<div class="flex flex-col flex-1 h-full">
  <div class="grid w-full gap-2 justify-center p-2"
  style={`grid-template-columns: repeat(auto-fit, minmax(208px, 1fr));`}
  >
    {#each mediaItems as mediaItem}
      <GalleryItem
        isArchived={mediaItem.isArchived} onMoveToArchive={() => toggleArchivedStatus(mediaItem.id, mediaItem.isArchived)} 
        onMoveToInbox={() => toggleArchivedStatus(mediaItem.id, mediaItem.isArchived)}  
        onConfirmDelete={() => deleteItem(mediaItem.id)} 
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
        No items in inbox
      </div>
    {/if}
  </div>

</div>

<svelte:head>
  <title>NoriBooru - Inbox</title>
</svelte:head>
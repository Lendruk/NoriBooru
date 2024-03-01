<script lang="ts">
	import Tag from '$lib/Tag.svelte';
	import Video from '$lib/Video.svelte';
	import type { MediaItem } from '$lib/types/MediaItem';
	import { onMount } from 'svelte';
	import GalleryItem from './GalleryItem.svelte';
	import { HttpService } from '$lib/services/HttpService';
	import Accordeon from '$lib/Accordeon.svelte';
	import TagSearchInput from '$lib/TagSearchInput.svelte';
	import type { TagDef } from '$lib/types/TagDef';

  let mediaItems: MediaItem[]  = [];
  let filtersVisible: boolean = true;
  let appliedPositiveTags: TagDef[] = [];
  let appliedNegativeTags: TagDef[] = [];
  let tags: TagDef[] = [];
  let sortMethod: 'newest' | 'oldest' = 'newest';

	onMount(async () => {
    await search();
    tags = await HttpService.get<TagDef[]>('/tags');
	});

  async function applyPositiveTagFilter(tag: TagDef) {
    appliedPositiveTags = [...appliedPositiveTags, tag];
    await search();
  }

  async function applyNegativeTagFilter(tag: TagDef) {
    appliedNegativeTags = [...appliedNegativeTags, tag];
    await search();
  }

  async function search() {
    const res = await HttpService.get<{ mediaItems: MediaItem[] }>('/mediaItems?' + new URLSearchParams(
      { 
        negativeTags: JSON.stringify(appliedNegativeTags.map(tag => tag.id)), 
        positiveTags: JSON.stringify(appliedPositiveTags.map(tag => tag.id )),
        sortMethod,
        archived: 'true',
      }));

      mediaItems = res.mediaItems;
  }

  async function removePositiveTagFilter(tag: TagDef) {
    appliedPositiveTags = appliedPositiveTags.filter(t => t.id !== tag.id);
    await search();
  }

  async function removeNegativeTagFilter(tag: TagDef) {
    appliedNegativeTags = appliedNegativeTags.filter(t => t.id !== tag.id);
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

  function onPositiveTagSearchSubmit(value: string) {
    if (value) {
      const tag = tags.find(tag => tag.name.toLowerCase().startsWith(value.toLowerCase()) && !appliedPositiveTags.concat(appliedNegativeTags).find(at => at.id === tag.id));
      if (tag) {
        applyPositiveTagFilter(tag);
      } else {
        // TODO - warn
      }
    }
  }

  function onNegativeTagSearchSubmit(value: string) {
    if (value) {
      const tag = tags.find(tag => tag.name.toLowerCase().startsWith(value.toLowerCase()) && !appliedPositiveTags.concat(appliedNegativeTags).find(at => at.id === tag.id));
      if (tag) {
        applyNegativeTagFilter(tag);
      } else {
        // TODO - warn
      }
    }
  }
</script>

<div class="flex flex-row flex-1 justify-between">
  <div />
</div>

<div class="flex flex-col flex-1 h-full">
  <Accordeon header="Filters">
    <div class="mb-2">Positive Tags</div>
    <div class="flex flex-1 flex-row flex-wrap w-full bg-zinc-800 rounded-md">
      {#each appliedPositiveTags as tag }
        <Tag onClick={() => removePositiveTagFilter(tag)} mediaCount={tag.mediaCount} color={tag.tagType?.color} text={tag.name} />
      {/each}
      <TagSearchInput 
        tags={tags} 
        class="outline-none h-[40px] indent-2"
        ignoredTags={appliedPositiveTags.concat(appliedNegativeTags)} 
        onTagSearchSubmit={onPositiveTagSearchSubmit} 
      />
    </div>
    <div class="mb-2">Negative Tags</div>
    <div class="flex flex-1 flex-row flex-wrap w-full bg-zinc-800 rounded-md">
      {#each appliedNegativeTags as tag }
        <Tag onClick={() => removeNegativeTagFilter(tag)} mediaCount={tag.mediaCount} color={tag.tagType?.color} text={tag.name} />
      {/each}
      <TagSearchInput 
        tags={tags} 
        class="outline-none h-[40px] indent-2"
        ignoredTags={appliedPositiveTags.concat(appliedNegativeTags)} 
        onTagSearchSubmit={onNegativeTagSearchSubmit} 
      />
    </div>

    <div>
      Sort by: 
      <select bind:value={sortMethod} on:change={search} class="text-black" >
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
      </select>
    </div>
  </Accordeon>
    <div class="grid w-full gap-2 justify-center p-4"
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

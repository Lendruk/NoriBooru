<script lang="ts">
	import { page } from "$app/stores";
	import Tag from "$lib/Tag.svelte";
	import { HttpService } from "$lib/services/HttpService";
	import type { MediaItemWithTags } from "$lib/types/MediaItem";
	import type { TagDef } from "$lib/types/TagDef";

  let foundTags: TagDef[] = $state([]);
  let tags: TagDef[] = $state([]);
  let tagSearchText = $state("");
  let mediaItem: MediaItemWithTags | undefined = $state(undefined);
  let next: string | undefined = $state(undefined);
  let previous: string | undefined = $state(undefined);

  $effect(() => {
    HttpService.get<{ mediaItem: MediaItemWithTags, next?: string, previous?: string, tags: TagDef[] }>(`/mediaItems/${$page.params.id}`).then(res => {
      mediaItem = res.mediaItem;
      tags = res.tags;
      next = res.next;
      previous = res.previous;
    })
  });

  function searchTags() {
    if(tagSearchText === "") {
      foundTags = [];
    } else {
      foundTags = tags!.filter(tag => tag.name.toLowerCase().includes(tagSearchText.toLowerCase()) && !mediaItem?.tags.find(t => t.id === tag.id));
    }
  }

  async function addTagToMedia(tag: TagDef) {
    await HttpService.put(`/mediaItems/${mediaItem?.id}/tags`, tag);
    mediaItem!.tags = [...tags, tag];
    tagSearchText = "";
    foundTags = [];
  }

  async function removeTagFromMedia(tag:TagDef) {
    await HttpService.delete(`/mediaItems/${mediaItem?.id}/tags`, tag);
    mediaItem!.tags = mediaItem!.tags.filter(t => t.id !== tag.id);
  }
</script>

<div class="flex flex-row">
  <a href={previous ? `/gallery/${previous}` : '#'} class={`flex justify-center items-center w-1/12 ${!previous && 'cursor-not-allowed'}`}>&lt;</a>
  <div class="flex flex-row flex-1">
    <div class="max-w-[30%]">
      {#if mediaItem?.type === "image"}
        <img class="bg-cover" src={`${HttpService.BASE_URL}/images/${HttpService.getVaultId()}/${mediaItem.fileName}.${mediaItem.extension}`} alt="gallery-img" />
      {/if}
      {#if mediaItem?.type === "video"}
        <video class="bg-cover w-full h-full" src={`${HttpService.BASE_URL}/videos/${HttpService.getVaultId()}/${mediaItem.fileName}.${mediaItem.extension}`}  controls>
          <track kind="captions" />
        </video>
      {/if}
    </div>
    <div class="flex flex-col flex-1">
      <p>Tags</p>
      <input type="text" bind:value={tagSearchText} on:input={searchTags} placeholder="Search Tags" />
          <div>Found tags</div>
          <div class="tags">
            {#each foundTags as tag }
              <Tag onClick={() => addTagToMedia(tag)} mediaCount={tag.mediaCount} color={tag.tagType?.color} text={tag.name} />
            {/each}
          </div>
      <p>Current media tags</p>
      <div class="tags">
        {#if mediaItem}
          {#each mediaItem.tags as tag}
            <Tag onDelete={() => removeTagFromMedia(tag)} mediaCount={tag.mediaCount} color={tag?.tagType?.color} text={tag?.name} />
          {/each}
        {/if}
      </div>
    </div>
  </div>
  <a href={next ? `/gallery/${next}` : '#'} class={`flex justify-center items-center w-1/12 ${!next && 'cursor-not-allowed'}`}>&gt;</a>
</div>

<script lang="ts">
	import ArchiveIcon from "$lib/icons/ArchiveIcon.svelte";
	import TrashIcon from "$lib/icons/TrashIcon.svelte";
  import { HttpService } from "$lib/services/HttpService";
	import GalleryItemButton from "../../../gallery/GalleryItemButton.svelte";
  export let imageName: string;
  export let imageId: number;
  export let onDeletion: () => void;

  let isFullscreen = false;

  async function deleteItem() {
    await HttpService.delete(`/mediaItems/${JSON.stringify([imageId])}`);
    onDeletion();
  }

  async function moveItemToArchive() {
    await HttpService.patch(`/mediaItems/${JSON.stringify([imageId])}`, { isArchived: true });
  }

  function onImageClick() {
    isFullscreen = !isFullscreen;
  }

  function onKeyPress(event: KeyboardEvent) {
    if (event.key === "Escape") {
      isFullscreen = false;
    }
  }

</script>

{#if isFullscreen}
  <div on:click={() => isFullscreen = false} class="flex items-center justify-center absolute h-full w-full top-0 left-0 z-50 backdrop-blur-sm">
    <img class="bg-contain" src={`${HttpService.BASE_URL}/images/${HttpService.getVaultId()}/${imageName}.png`} />
  </div>
{/if}
<div class="flex flex-1 items-center justify-center relative">
  <img on:click={() => onImageClick()} class="bg-contain h-[50%] w-[50%] cursor-pointer z-10" src={`${HttpService.BASE_URL}/images/${HttpService.getVaultId()}/${imageName}.png`} alt="gallery-img" />
  <div class="absolute flex w-full h-full">
    <div class="flex justify-end items-end flex-1 self-end p-4 gap-2 flex-col">
      <GalleryItemButton onClick={moveItemToArchive}>
        <ArchiveIcon />
      </GalleryItemButton>
      <GalleryItemButton onClick={deleteItem}>
        <TrashIcon/>
      </GalleryItemButton>
    </div>
  </div>
</div>
<svelte:window on:keydown={onKeyPress} />
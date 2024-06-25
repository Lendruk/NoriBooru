<script lang="ts">
	import Tooltip from "$lib/Tooltip.svelte";
	import { createToast } from "$lib/components/toast/ToastContainer.svelte";
	import ArchiveIcon from "$lib/icons/ArchiveIcon.svelte";
	import InboxIcon from "$lib/icons/InboxIcon.svelte";
	import SeedIcon from "$lib/icons/SeedIcon.svelte";
	import TrashIcon from "$lib/icons/TrashIcon.svelte";
  import { HttpService } from "$lib/services/HttpService";
	import GalleryItemButton from "../../../gallery/GalleryItemButton.svelte";
  export let imageName: string;
  export let imageId: number;
  export let onDeletion: () => void;
  export let onSetSeed: () => void;

  let isFullscreen = false;
  let isArchived = false;

  async function deleteItem() {
    await HttpService.delete(`/mediaItems/${JSON.stringify([imageId])}`);
    onDeletion();
  }

  async function toggleArchival() {
    isArchived = !isArchived;
    await HttpService.patch(`/mediaItems/${JSON.stringify([imageId])}`, { isArchived: isArchived });
    createToast(`Image ${isArchived ? 'archived' : 'un-archived' } successfully!`);
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
    <div class="flex justify-end self-end p-4">
      <GalleryItemButton onClick={onSetSeed}>
        <Tooltip>
          <div slot="toolTipContent">Use seed</div>
          <span slot="target">
            <SeedIcon />
          </span>
        </Tooltip>
      </GalleryItemButton>
    </div>
    <div class="flex justify-end items-end flex-1 self-end p-4 gap-2 flex-col">
      <GalleryItemButton onClick={toggleArchival}>
        {#if !isArchived}
          <InboxIcon />
        {:else}
          <ArchiveIcon />
        {/if}
      </GalleryItemButton>
      <GalleryItemButton onClick={deleteItem}>
        <TrashIcon/>
      </GalleryItemButton>
    </div>
  </div>
</div>
<svelte:window on:keydown={onKeyPress} />
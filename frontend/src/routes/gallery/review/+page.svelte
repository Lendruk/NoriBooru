<script lang="ts">
	import { goto } from "$app/navigation";
	import Button from "$lib/Button.svelte";
	import Modal from "$lib/Modal.svelte";
	import ArchiveIcon from "$lib/icons/ArchiveIcon.svelte";
	import ArrowLeft from "$lib/icons/ArrowLeft.svelte";
	import ArrowRight from "$lib/icons/ArrowRight.svelte";
	import DoorOpen from "$lib/icons/DoorOpen.svelte";
	import TrashIcon from "$lib/icons/TrashIcon.svelte";
	import { HttpService } from "$lib/services/HttpService";
	import type { MediaItemWithTags } from "$lib/types/MediaItem";
  type ReviewAction = "Archive" | "Delete";

  let currentMediaIndex = $state(0);
  let mediaIds = $state<number[]>([]);
  let fetchedMediaItems = $state<Map<number, MediaItemWithTags>>(new Map());
  let currentMediaItem = $state<MediaItemWithTags | undefined>(undefined);
  let actionMap = $state<Map<number, ReviewAction | undefined>>(new Map());
  let showModal = $state(false);

  const inboxUrl = '/gallery?inbox=true';
  $effect(() => {
    HttpService.get<number[]>('/mediaItems/review').then(async items => {
      mediaIds = items.reverse();
      const firstItem = await fetchMediaItem(mediaIds[0]);
      currentMediaItem = firstItem;
      fetchedMediaItems.set(firstItem.id, firstItem);
    });
  });

  async function fetchMediaItem(id: number): Promise<MediaItemWithTags> {
    const {mediaItem} = await HttpService.get<{ mediaItem: MediaItemWithTags}>(`/mediaItems/${id}`);
    return mediaItem;
  }

  async function handleClickLeft() {
    if (currentMediaIndex - 1 >= 0) {
      currentMediaIndex = currentMediaIndex - 1;
      if(!fetchedMediaItems.has(mediaIds[currentMediaIndex])) {
        const newMediaItem = await fetchMediaItem(mediaIds[currentMediaIndex]);
        fetchedMediaItems.set(newMediaItem.id, newMediaItem);
        currentMediaItem = newMediaItem;
      } else {
        currentMediaItem = fetchedMediaItems.get(mediaIds[currentMediaIndex]);
      }
    }
  }

  async function handleClickRight() {
    if (currentMediaIndex + 1 < mediaIds.length) {
      currentMediaIndex = currentMediaIndex + 1;
      if(!fetchedMediaItems.has(mediaIds[currentMediaIndex])) {
        const newMediaItem = await fetchMediaItem(mediaIds[currentMediaIndex]);
        fetchedMediaItems.set(newMediaItem.id, newMediaItem);
        currentMediaItem = newMediaItem;
      } else {
        currentMediaItem = fetchedMediaItems.get(mediaIds[currentMediaIndex]);
      }
    }
  }

  function markItemForArchival(mediaItemId: number) {
    actionMap.set(mediaItemId, 'Archive');
    actionMap = new Map(actionMap);
  }

  function markItemForDeletion(mediaItemId: number) {
    actionMap.set(mediaItemId, 'Delete');
    actionMap = new Map(actionMap);
  }

  function onKeyDown(e: KeyboardEvent) {
		 switch(e.key) {
        case "ArrowLeft":
          handleClickLeft();
          break;
        case "ArrowRight":
          handleClickRight();
          break;
        case " ":
          markItemForArchival(currentMediaItem!.id);
          break;
        case "d":
          markItemForDeletion(currentMediaItem!.id);
          break;
        case "Escape":
          goto(inboxUrl);
          break;
		 }
	}

  async function onReviewFinishConfirmation() {
    let itemsToArchive: number[] = [];
    let itemsToDelete: number[] = [];

    for(const pair of actionMap) {
      if(pair[1] === 'Archive') {
        itemsToArchive.push(pair[0]);
      } else {
        itemsToDelete.push(pair[0]);
      }
    }

    let promises: Promise<unknown>[] = [];
    if(itemsToArchive.length > 0) {
      promises.push(HttpService.patch(`/mediaItems/${JSON.stringify(itemsToArchive)}`, { isArchived: true }))
    }

    if(itemsToDelete.length > 0) {
      promises.push(HttpService.delete(`/mediaItems/${JSON.stringify(itemsToDelete)}`));
    }

    await Promise.all(promises);

    goto(inboxUrl);
  }
</script>

<div class="absolute right-10 top-5 z-[21]">
  {currentMediaIndex + 1} / {mediaIds.length}
</div>
<div class="absolute right-10 bottom-5 z-[21] bg-zinc-900 p-3 rounded-md">
  <button on:click={() => {
    if (actionMap.size > 0) {
      showModal = true;
    } else {
      goto(inboxUrl);
    }
  }}><DoorOpen width={32} height={32} /></button>
</div>
<div class="flex flex-row flex-1 h-full absolute top-0 left-0 w-full z-[20]">
  <button on:click={handleClickLeft} class={`flex fill-white justify-center items-center w-1/12 bg-red-950 hover:bg-red-900 hover:transition ${currentMediaIndex - 1 < 0 && 'cursor-not-allowed'}`}>
    <ArrowLeft />
  </button>
  {#if currentMediaItem}
    <div class="flex flex-1 flex-col justify-center items-center bg-zinc-800 backdrop-blur-lg bg-opacity-5">
      {#if currentMediaItem.type === "image"}
        <img class="max-w-full max-h-full" src={`${HttpService.BASE_URL}/images/${HttpService.getVaultId()}/${currentMediaItem.fileName}.${currentMediaItem.extension}`} alt="gallery-img" />
      {/if}
      {#if currentMediaItem.type === "video"}
        <video class="bg-cover w-full h-full" src={`${HttpService.BASE_URL}/videos/${HttpService.getVaultId()}/${currentMediaItem.fileName}.${currentMediaItem.extension}`}  controls>
          <track kind="captions" />
        </video>
      {/if}

      <div class="fill-white flex gap-4 mt-10">
        <button on:click={() => markItemForArchival(currentMediaItem!.id)} class={`${actionMap.get(currentMediaItem!.id) === 'Archive' ? 'bg-red-950' : 'bg-red-900'} rounded-full p-4`}>
          <ArchiveIcon width={32} height={32} />
        </button>
        <button on:click={() => markItemForDeletion(currentMediaItem!.id)} class={`${actionMap.get(currentMediaItem!.id) === 'Delete' ? 'bg-red-950' : 'bg-red-900'} rounded-full p-4`}>
          <TrashIcon width={32} height={32} />
        </button>
      </div>
    </div>
  {/if}
  <button on:click={handleClickRight} class={`flex justify-center bg-red-950 hover:bg-red-900 hover:transition fill-white items-center w-1/12 ${currentMediaIndex + 1 >= mediaIds.length && 'cursor-not-allowed'}`}>
    <ArrowRight />
  </button>
</div>

<Modal bind:showModal={showModal}>
		<div class="flex flex-1 flex-col m-4 gap-4">
      <div>Finish Review</div>
      <div>
        You will be archiving / deleting {actionMap.size} item{actionMap.size > 1 ? 's' : ''}
      </div>
			<Button class="bg-red-950 hover:bg-red-800 h-[40px]" onClick={onReviewFinishConfirmation}>Confirm</Button>
		</div>
</Modal>

<svelte:window on:keydown={onKeyDown} />
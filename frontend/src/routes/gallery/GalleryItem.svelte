<script lang="ts">
  import InboxIcon from "$lib/icons/InboxIcon.svelte";
import TagIcon from "$lib/icons/TagIcon.svelte";
import GalleryItemButton from "./GalleryItemButton.svelte";

  export let href = "";
  export let className = "";
  export let onConfirmDelete = () => {};
  export let onMoveToArchive = () => {};
  export let onMoveToInbox = () => {};
  export let onTagButtonClick = () => {};
  export let isArchived = false;
  export let style = '';

  let confirmingDelete = false;
  let showOptions = false;

  const reset = () => {
    confirmingDelete = false;
  }
</script>

<a on:mouseenter={() => showOptions = true} on:mouseleave={() => { showOptions = false; reset()}} style={style} class={className + " relative group"} href={href}>
  <div class={`absolute inset-0 bg-black opacity-0 group-hover:transition-opacity group-hover:opacity-50`}/>
  <div class={`${!showOptions ? 'hidden' : 'flex' } flex-1 w-full h-full absolute top-0`}>
    <div class="flex flex-1 flex-col">
      <div class="m-2 flex flex-1 justify-end">
        {#if isArchived}
          <GalleryItemButton onClick={onMoveToInbox}>
            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2023 Fonticons, Inc.--><path d="M32 32H480c17.7 0 32 14.3 32 32V96c0 17.7-14.3 32-32 32H32C14.3 128 0 113.7 0 96V64C0 46.3 14.3 32 32 32zm0 128H480V416c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V160zm128 80c0 8.8 7.2 16 16 16H336c8.8 0 16-7.2 16-16s-7.2-16-16-16H176c-8.8 0-16 7.2-16 16z"/></svg>
          </GalleryItemButton>
        {:else} 
          <GalleryItemButton onClick={onMoveToArchive}>
           <InboxIcon />
          </GalleryItemButton>
        {/if}
      </div>
      <div class="flex gap-4 flex-1 items-end justify-end justify-items-end m-2">
        <GalleryItemButton onClick={onTagButtonClick}>
          <TagIcon />
        </GalleryItemButton>
  
        {#if confirmingDelete}
          <GalleryItemButton onClick={onConfirmDelete}>
            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="14" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2023 Fonticons, Inc.--><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>
          </GalleryItemButton>
        {/if}
        {#if !confirmingDelete}
          <GalleryItemButton onClick={() => confirmingDelete = true}>
            <svg xmlns="http://www.w3.org/2000/svg" class="text-white" height="16" width="14" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2023 Fonticons, Inc.--><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>
          </GalleryItemButton>
        {/if}
      </div>
    </div>
  </div>
  <slot />
</a>
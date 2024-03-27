<script lang="ts">
  export let isDrawerOpen = false;

  function onKeyPress(event: KeyboardEvent) {
    if (event.key === "Escape") {
      isDrawerOpen = false;
    }
  }

</script>

<div class={`${isDrawerOpen ? 'flex' : 'hidden'} absolute right-0 top-0 w-full h-full flex z-[40]`}>
  <div on:click={() => isDrawerOpen = false} class="flex flex-1 bg-zinc-900 bg-opacity-90 backdrop-blur-sm">

  </div>
  <div class="flex flex-1 self-end bg-red-950 h-full">
    <slot />
  </div>
</div>

<svelte:window on:keydown={onKeyPress} />
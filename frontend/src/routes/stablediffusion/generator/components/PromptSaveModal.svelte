<script lang="ts">
	import Button from "$lib/Button.svelte";

  export let isOpen: boolean;
  export let onSubmit: (name: string) => void | Promise<void>;
  let name: string;

  function onKeyPress(event: KeyboardEvent) {
    if (event.key === "Escape") {
      isOpen = false;
    }
  }
</script>

<div class="absolute flex items-center justify-center h-full w-full top-0 left-0 z-50 backdrop-blur-sm">
  <div class="bg-zinc-900">
    <div>
      <div>Name</div>
      <input type="text" bind:value={name} />
    </div>
    <Button onClick={() => {onSubmit(name); isOpen = false;}}>Submit</Button>
  </div>
</div>

<svelte:window on:keydown={onKeyPress} />
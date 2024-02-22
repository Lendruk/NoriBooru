<script lang="ts">
	import GalleryItemButton from "../../gallery/GalleryItemButton.svelte";

  export let onAddClick = () => {};
  export let onRemoveClick = () => {};

  let isAdded = false;
  let showOptions = false;

  function onButtonClick() {
    if (isAdded) {
      onRemoveClick();
    } else {
      onAddClick();
    }
    isAdded = !isAdded;
  }

</script>

<div class="w-1/4 relative flex items-center justify-center" style="height: fit-content;" on:mouseenter={() => showOptions = true} on:mouseleave={() => showOptions = false}>
  <GalleryItemButton onClick={onButtonClick} cssClasses={`${(!showOptions && !isAdded) ? 'hidden' : 'flex' } absolute flex justify-center items-center self-center`}>
    {`${isAdded ? '-' : '+'}`}
  </GalleryItemButton>
  <slot />
</div>
<script lang="ts">
	import XIcon from "$lib/icons/XIcon.svelte";
	import { onMount } from "svelte";
  export let onDismissClick: () => void;
  export let content = "";
  export let dismissIn = 0;

  let curWidthPercentage = 100;
  let perTickWidthDecrease = 0;
  let progressBarRef: HTMLDivElement;
  onMount(() => {
    if (dismissIn !== 0) {
      perTickWidthDecrease = 100 / (dismissIn / 50);
      let interval = setInterval(() => {
        curWidthPercentage -= perTickWidthDecrease;

        if(curWidthPercentage <= 0) {
          clearInterval(interval);
          onDismissClick();
        }
      }, 50); 
    }
  });
</script>

<div class="bg-red-950 min-w-[150px] rounded-lg flex flex-col fill-white">
  <div class="flex flex-1 justify-between items-center p-4">
    <div>
      {content}
    </div>
    <button on:click={onDismissClick}>
      <XIcon />
    </button>
  </div>
  <div style={`width:${curWidthPercentage}%;`} bind:this={progressBarRef} class="bg-red-900 w-full h-[5px] rounded-b-lg transition"></div>
</div>
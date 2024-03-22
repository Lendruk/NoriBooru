<script lang="ts">
	import { HttpService } from "$lib/services/HttpService";
	import type { MediaItem } from "$lib/types/MediaItem";
  export let row: MediaItem;
</script>

<div class="w-[70px] h-[70px]">
  {#if row.type === "image"}
    <img class="max-w-full max-h-full" src={`${HttpService.BASE_URL}/images/${HttpService.getVaultId()}/${row.fileName}.${row.extension}`} alt="gallery-img" />
  {:else}
    <video class="bg-cover w-full h-full" src={`${HttpService.BASE_URL}/videos/${HttpService.getVaultId()}/${row.fileName}.${row.extension}`} controls={false}/>
  {/if}
</div>